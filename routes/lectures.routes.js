const router = require("express").Router();
const { Lecture } = require("../models/lecture.model");
const { Sequelize, Op } = require("sequelize");

const Room = require("../models/room.model");
const Lecturer = require("../models/lecturer.model");
const Stage = require("../models/stage.model");

/* ---------- helpers ---------- */
const toNull = (v) => (v === "" || v === undefined ? null : v);

async function existsConflict({ room_id, day_of_week, start_time, end_time, stageId, excludeId }) {
  if (!room_id || !day_of_week || !start_time || !end_time || !stageId) return null;

  const where = {
    RoomId: room_id,
    day_of_week,
    StageId: stageId,
    id: { [Op.ne]: excludeId }, // ← exclude current lecture in updates
    [Op.or]: [
      { start_time: { [Op.between]: [start_time, end_time] } },
      { end_time: { [Op.between]: [start_time, end_time] } },
      {
        [Op.and]: [
          { start_time: { [Op.lte]: start_time } },
          { end_time: { [Op.gte]: end_time } },
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
    hours_number,
  } = req.body;

  try {
    if (!stage_id) return res.status(400).json({ error: "Stage is required" });

    const day = toNull(day_of_week);
    const start = toNull(start_time);
    const end = toNull(end_time);
    const roomId = toNull(room_id);
    const stageId = stage_id;
    const hoursNum = hours_number === "" || hours_number === undefined ? null : Number(hours_number);

    const conflicts = [];

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

    const lecture = await Lecture.create({
      course_name: course_name ?? null,
      day_of_week: day,
      start_time: start,
      end_time: end,
      RoomId: roomId ?? null,
      StageId: stageId,
      hours_number: hoursNum,
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

/* ---------- PUT update Lecture i think i was commenting for no reason so the user when he click edi it get all the current data from the get req  ---------- */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    course_name,  // this is where can we change the course name or updating it same goes for the others 
    room_id,
    day_of_week,
    start_time,
    end_time,
    lecturer_ids,
    stage_id,
    hours_number,
  } = req.body;

  try {
    const lecture = await Lecture.findByPk(id);   //findByPk is Sequlize method to get the the lectures based on there id 
    if (!lecture) return res.status(404).json({ error: "Lecture not found" });

    if (!stage_id) return res.status(400).json({ error: "Stage is required" });

    const day = toNull(day_of_week);
    const start = toNull(start_time);
    const end = toNull(end_time);
    const roomId = toNull(room_id);
    const stageId = stage_id;
    const hoursNum = hours_number === "" || hours_number === undefined ? null : Number(hours_number);

    const conflicts = [];

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

    const roomConflict = await existsConflict({
      room_id: roomId,
      day_of_week: day,
      start_time: start,
      end_time: end,
      stageId,
      excludeId: id, //
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

    await lecture.update({
      course_name: course_name ?? null,
      day_of_week: day,
      start_time: start,
      end_time: end,
      RoomId: roomId ?? null,
      StageId: stageId,
      hours_number: hoursNum,
    });

    if (Array.isArray(lecturer_ids)) {
      await lecture.setLecturers(lecturer_ids);
    }

    const updatedLecture = await Lecture.findByPk(lecture.id, {
      include: [Room, Lecturer, Stage],
    });

    res.json(updatedLecture);
  } catch (err) {
    console.error("Error updating lecture:", err);
    res.status(500).json({ error: "Error updating lecture" });
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

    res.json({ data: lectures });
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
