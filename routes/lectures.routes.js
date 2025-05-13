const router = require('express').Router();
const { Lecture } = require('../models/lecture.model');
const { Sequelize, Op } = require('sequelize');

const Room = require('../models/room.model');
const Lecturer = require('../models/lecturer.model');
const Stage = require('../models/stage.model'); // Include Stage model

/* ---------- helper: conflict check ---------- */
async function existsConflict({ room_id, day_of_week, start_time, end_time, stageId }) {
  const conflictingLecture = await Lecture.findOne({
    where: {
      RoomId: room_id,
      day_of_week,
      StageId: stageId,
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
    },
  });

  return conflictingLecture;
}

/* ---------- POST create Lecture ---------- */
router.post('/', async (req, res) => {
  const { course_name, room_id, day_of_week, start_time, end_time, lecturer_ids, stage_id } = req.body;

  try {
    if (!stage_id) {
      return res.status(400).json({ error: 'Stage is required' });
    }

    const conflicts = [];

    // Check for lecturer day-off conflicts
    const lecturers = await Lecturer.findAll({ where: { id: lecturer_ids } });

    for (const lecturer of lecturers) {
      const dayOffs = Array.isArray(lecturer.day_offs) ? lecturer.day_offs : [];

      if (dayOffs.includes(day_of_week)) {
        conflicts.push({
          type: 'Lecturer Day Off',
          lecturer: lecturer.name,
          day: day_of_week,
          reason: `Lecturer ${lecturer.name} is off on ${day_of_week}`,
        });
      }
    }

    // Check for room conflicts
    const roomConflict = await existsConflict({ 
      room_id, 
      day_of_week, 
      start_time, 
      end_time, 
      stageId: stage_id,
    });

    if (roomConflict) {
      conflicts.push({
        type: 'Room Conflict',
        room: roomConflict.RoomId,
        start_time,
        end_time,
        reason: `Room is already booked in that slot.`,
      });
    }

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Conflicts detected.', conflicts });
    }

    const lecture = await Lecture.create({
      course_name,
      day_of_week,
      start_time,
      end_time,
      RoomId: room_id,
      StageId: stage_id,  // Use StageId now
    });

    if (Array.isArray(lecturer_ids) && lecturer_ids.length) {
      await lecture.setLecturers(lecturer_ids);
    }

    const createdLecture = await Lecture.findByPk(lecture.id, {
      include: [Room, Lecturer, Stage],
    });

    res.status(201).json(createdLecture);

  } catch (err) {
    console.error('Error creating lecture:', err);
    res.status(500).json({ error: 'Error creating lecture' });
  }
});

/* ---------- GET all lectures ---------- */
/* ---------- GET all lectures ---------- */
router.get('/', async (req, res) => {
  const { stage_id, start_date, end_date } = req.query;

  const queryOptions = {
    include: [
      { model: Room },
      { model: Stage, attributes: ['id', 'name'] },
      {
        model: Lecturer,
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
    ],
    order: [['createdAt', 'ASC']],
    where: {},
  };

  if (stage_id) {
    queryOptions.where.StageId = stage_id;
  }

  if (start_date && end_date) {
    queryOptions.where.createdAt = {
      [Op.gte]: new Date(start_date),
      [Op.lte]: new Date(end_date),
    };
  }

  try {
    // Fetch lectures within the current period
    const lectures = await Lecture.findAll(queryOptions);

    // Determine distinct periods
    const distinctPeriods = await Lecture.findAll({
      attributes: [
        [Sequelize.fn('MIN', Sequelize.col('createdAt')), 'start_date'],
        [Sequelize.fn('MAX', Sequelize.col('createdAt')), 'end_date'],
      ],
      group: ['StageId'],
      where: stage_id ? { StageId: stage_id } : {},
    });

    const periods = distinctPeriods.map(p => ({
      start: new Date(p.getDataValue('start_date')),
      end: new Date(p.getDataValue('end_date')),
    }));

    let currentPeriodIndex = -1;

    if (start_date && end_date) {
      currentPeriodIndex = periods.findIndex(period => {
        return (
          new Date(start_date).getTime() === period.start.getTime() &&
          new Date(end_date).getTime() === period.end.getTime()
        );
      });
    }

    const hasNext = currentPeriodIndex < periods.length - 1;
    const hasPrevious = currentPeriodIndex > 0;

    res.json({
      data: lectures,
      startDate: start_date,
      endDate: end_date,
      hasNext,
      hasPrevious,
      nextPeriod: hasNext ? periods[currentPeriodIndex + 1] : null,
      prevPeriod: hasPrevious ? periods[currentPeriodIndex - 1] : null,
    });

  } catch (err) {
    console.error('Error fetching lectures:', err);
    res.status(500).json({ error: 'Error fetching lectures' });
  }
});


/* ---------- DELETE lecture ---------- */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Lecture.destroy({ where: { id } });
    res.json({ message: 'Lecture deleted successfully' });
  } catch (err) {
    console.error('Error deleting lecture:', err);
    res.status(500).json({ error: 'Error deleting lecture' });
  }
});

module.exports = router;
