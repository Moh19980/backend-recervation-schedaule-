const router = require("express").Router();
const { Lecture } = require("../models/lecture.model");
const { Sequelize, Op } = require("sequelize");

const Room = require("../models/room.model");
const Lecturer = require("../models/lecturer.model");
const Stage = require("../models/stage.model");

/* ---------- helpers ---------- */

// يحوّل "", undefined إلى null للتوحيد
const toNull = (v) => (v === "" || v === undefined ? null : v);

// يبني where مرن لفحص التعارض فقط عند توفر القيم
async function existsConflict({ room_id, day_of_week, start_time, end_time, stageId }) {
  // إذا أي من هذه غير موجود، نوقف فحص التعارض (ما نقدر نقارن أوقات/يوم)
  if (!room_id || !day_of_week || !start_time || !end_time || !stageId) {
    return null;
  }

  const where = {
    RoomId: room_id,
    day_of_week,
    StageId: stageId,
    [Op.or]: [
      { start_time: { [Op.between]: [start_time, end_time] } },
      { end_time:   { [Op.between]: [start_time, end_time] } },
      {
        [Op.and]: [
          { start_time: { [Op.lte]: start_time } },
          { end_time:   { [Op.gte]: end_time } },
        ],
      },
    ],
  };

  return Lecture.findOne({ where });
}

/* ---------- POST create Lecture ---------- */
router.post("/", async (req, res) => {
  const {
    course_name,
    room_id,
    day_of_week,
    start_time,
    end_time,
    lecturer_ids,
    stage_id,
    hours_number, // لو موجود بالفرونت
  } = req.body;

  try {
    // الشيء الوحيد الإلزامي
    if (!stage_id) {
      return res.status(400).json({ error: "Stage is required" });
    }

    // طبّع القيم (خاصة لو إجت "" من الفرونت)
    const day      = toNull(day_of_week);
    const start    = toNull(start_time);
    const end      = toNull(end_time);
    const roomId   = toNull(room_id);
    const stageId  = stage_id;
    const hoursNum = hours_number === "" || hours_number === undefined ? null : Number(hours_number);

    const conflicts = [];

    // فحص عطلة التدريسيين فقط إذا اليوم موجود
    if (day && Array.isArray(lecturer_ids) && lecturer_ids.length) {
      const lecturers = await Lecturer.findAll({ where: { id: lecturer_ids } });
      for (const lecturer of lecturers) {
        const dayOffs = Array.isArray(lecturer.day_offs) ? lecturer.day_offs : [];
        if (dayOffs.includes(day)) {
          conflicts.push({
            type: "Lecturer Day Off",
            lecturer: lecturer.name,
            day,
            reason: `Lecturer ${lecturer.name} is off on ${day}`,
          });
        }
      }
    }

    // فحص تعارض القاعة فقط إذا اليوم والوقت والغرفة متوفرة
    const roomConflict = await existsConflict({
      room_id: roomId,
      day_of_week: day,
      start_time: start,
      end_time: end,
      stageId,
    });

    if (roomConflict) {
      conflicts.push({
        type: "Room Conflict",
        room: roomConflict.RoomId,
        start_time: start,
        end_time: end,
        reason: `Room is already booked in that slot.`,
      });
    }

    if (conflicts.length > 0) {
      return res.status(409).json({ message: "Conflicts detected.", conflicts });
    }

    // إنشاء المحاضرة — الحقول الاختيارية ممكن تكون null
    const lecture = await Lecture.create({
      course_name: course_name ?? null,
      day_of_week: day,           // قد تكون null
      start_time : start,         // قد تكون null
      end_time   : end,           // قد تكون null
      RoomId     : roomId ?? null, // الغرفة نفسها صارت اختيارية لو ترغب
      StageId    : stageId,       // إلزامي
      hours_number: hoursNum,     // اختياري
    });

    if (Array.isArray(lecturer_ids) && lecturer_ids.length) {
      await lecture.setLecturers(lecturer_ids);
    }

    const createdLecture = await Lecture.findByPk(lecture.id, {
      include: [Room, Lecturer, Stage],
    });

    res.status(201).json(createdLecture);
  } catch (err) {
    console.error("Error creating lecture:", err);
    res.status(500).json({ error: "Error creating lecture" });
  }
});

/* ---------- GET all lectures ---------- */
router.get("/", async (req, res) => {
  const { stage_id, start_date, end_date } = req.query;

  const where = {};

  if (stage_id) where.StageId = stage_id;

  if (start_date && end_date) {
    where.createdAt = {
      [Op.gte]: new Date(start_date),
      [Op.lte]: new Date(end_date),
    };
  }

  try {
    const lectures = await Lecture.findAll({
      include: [
        { model: Room },
        { model: Stage, attributes: ["id", "name"] },
        {
          model: Lecturer,
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
      order: [["createdAt", "ASC"]],
      where,
    });

    // الفترات المميزة حسب الستيج (كما كانت)
    const distinctPeriods = await Lecture.findAll({
      attributes: [
        [Sequelize.fn("MIN", Sequelize.col("createdAt")), "start_date"],
        [Sequelize.fn("MAX", Sequelize.col("createdAt")), "end_date"],
      ],
      group: ["StageId"],
      where: stage_id ? { StageId: stage_id } : {},
    });

    const periods = distinctPeriods.map((p) => ({
      start: new Date(p.getDataValue("start_date")),
      end: new Date(p.getDataValue("end_date")),
    }));

    let currentPeriodIndex = -1;
    if (start_date && end_date) {
      currentPeriodIndex = periods.findIndex(
        (period) =>
          new Date(start_date).getTime() === period.start.getTime() &&
          new Date(end_date).getTime() === period.end.getTime()
      );
    }

    const hasNext = currentPeriodIndex < periods.length - 1;
    const hasPrevious = currentPeriodIndex > 0;

    res.json({
      data: lectures,
      startDate: start_date || null,
      endDate: end_date || null,
      hasNext,
      hasPrevious,
      nextPeriod: hasNext ? periods[currentPeriodIndex + 1] : null,
      prevPeriod: hasPrevious ? periods[currentPeriodIndex - 1] : null,
    });
  } catch (err) {
    console.error("Error fetching lectures:", err);
    res.status(500).json({ error: "Error fetching lectures" });
  }
});

/* ---------- DELETE lecture ---------- */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await Lecture.destroy({ where: { id } });
    res.json({ message: "Lecture deleted successfully" });
  } catch (err) {
    console.error("Error deleting lecture:", err);
    res.status(500).json({ error: "Error deleting lecture" });
  }
});

module.exports = router;