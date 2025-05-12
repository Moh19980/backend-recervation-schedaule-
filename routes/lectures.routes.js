const router = require('express').Router();
const { Lecture } = require('../models/lecture.model');
const { Sequelize, Op } = require('sequelize');

const Room = require('../models/room.model');
const Lecturer = require('../models/lecturer.model');

/* ---------- helper: conflict check ---------- */
async function existsConflict({ room_id, day_of_week, start_time, end_time, stage }) {
  const conflictingLecture = await Lecture.findOne({
    where: {
      RoomId: room_id,
      day_of_week,
      stage,
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

// POST create
// POST create
router.post('/', async (req, res) => {
  const { course_name, room_id, day_of_week, start_time, end_time, lecturer_ids, stage } = req.body;

  try {
    // Validate stage
    if (!['stage1', 'stage2', 'stage3', 'stage4'].includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage value.' });
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
      stage 
    });

    if (roomConflict) {
      conflicts.push({
        type: 'Room Conflict',
        room: roomConflict.RoomId,
        start_time,
        end_time,
        reason: `Room is already booked in that slot for stage ${stage}.`,
      });
    }

    // If there are any conflicts, send the response with status 409
    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Conflicts detected.', conflicts });
    }

    // No conflicts, proceed with creating the lecture
    const lecture = await Lecture.create({
      course_name,
      day_of_week,
      start_time,
      end_time,
      RoomId: room_id,
      stage,
    });

    // Attach lecturers
    if (Array.isArray(lecturer_ids) && lecturer_ids.length) {
      await lecture.setLecturers(lecturer_ids);
    }

    // Return the created lecture with its associated data
    const createdLecture = await Lecture.findByPk(lecture.id, {
      include: [Room, Lecturer],
    });

    res.status(201).json(createdLecture);

  } catch (err) {
    console.error('Error creating lecture:', err);
    res.status(500).json({ error: 'Error creating lecture' });
  }
});



/* ---------- CRUD ---------- */

// GET all lectures (with lecturers + room, ordered by day and time)
// GET all lectures with limit, pagination, and date-time filtering based on `createdAt`
router.get('/', async (req, res) => {
  const { stage, start_date, end_date } = req.query;

  const queryOptions = {
    include: [
      { model: Room },
      {
        model: Lecturer,
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
    ],
    order: [['createdAt', 'ASC']],
    where: {},
  };

  if (stage) {
    queryOptions.where.stage = stage;
  }

  if (start_date && end_date) {
    queryOptions.where.createdAt = {
      [Op.gte]: new Date(start_date),
      [Op.lte]: new Date(end_date),
    };
  }

  try {
    // Fetch schedule data for the current period
    const lectures = await Lecture.findAll(queryOptions);

    // Get all distinct schedule periods
    const distinctPeriods = await Lecture.findAll({
      attributes: [
        [Sequelize.fn('MIN', Sequelize.col('createdAt')), 'start_date'],
        [Sequelize.fn('MAX', Sequelize.col('createdAt')), 'end_date'],
      ],
      group: ['stage'],
      where: stage ? { stage } : {},
    });

    const periods = distinctPeriods.map(p => ({
      start: new Date(p.getDataValue('start_date')),
      end: new Date(p.getDataValue('end_date')),
    }));

    // Identify the current period index
    let currentPeriodIndex = periods.findIndex(period => {
      return (
        new Date(start_date).getTime() === period.start.getTime() &&
        new Date(end_date).getTime() === period.end.getTime()
      );
    });

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
    console.error('Error fetching schedule data:', err);
    res.status(500).json({ error: 'Error fetching schedule data' });
  }
});

module.exports = router

// POST create

// DELETE lecture
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await Lecture.destroy({ where: { id } });
  res.json({ message: 'Lecture deleted successfully' });
});

// router.post('/generate-random', async (req, res) => {
//   const { stage } = req.body;

//   try {
//     const availableRooms = await Room.findAll();
//     const lecturers = await Lecturer.findAll();

//     const schedule = [];
//     const conflicts = [];

//     for (const day of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']) {
//       for (const room of availableRooms) {
//         // Randomly select a lecturer
//         const randomLecturer = lecturers[Math.floor(Math.random() * lecturers.length)];

//         if (!randomLecturer) {
//           console.warn(`No lecturers available for ${day}`);
//           continue;
//         }

//         const start_time = `${Math.floor(Math.random() * 8) + 8}:00:00`;
//         const end_time = `${parseInt(start_time.split(':')[0]) + 1}:00:00`;

//         // Ensure `day_offs` is a valid array
//         const dayOffs = Array.isArray(randomLecturer.day_offs) ? randomLecturer.day_offs : [];

//         // Handle lecturer day-off conflict
//         if (dayOffs.includes(day)) {
//           console.warn(`Lecturer ${randomLecturer.name} is off on ${day}`);
//           conflicts.push({
//             lecturer: randomLecturer.name,
//             day,
//             reason: `Lecturer is off on ${day}`
//           });
//           continue;
//         }

//         // Check for room conflicts
//         const conflict = await existsConflict({
//           room_id: room.id,
//           day_of_week: day,
//           start_time,
//           end_time,
//           stage,
//         });

//         if (conflict) {
//           console.warn(`Conflict detected for room ${room.id} on ${day} from ${start_time} to ${end_time}`);
//           conflicts.push({
//             room: room.name,
//             day,
//             start_time,
//             end_time,
//             reason: 'Room is already booked in this slot for the selected stage',
//           });
//           continue;
//         }

//         schedule.push({
//           course_name: `Course ${Math.random().toString(36).substring(7)}`,
//           day_of_week: day,
//           start_time,
//           end_time,
//           RoomId: room.id,
//           stage,
//           lecturer_ids: [randomLecturer.id],
//         });
//       }
//     }

//     // Notify the frontend team about conflicts
//     if (conflicts.length > 0) {
//       res.status(409).json({
//         message: 'Conflicts detected while generating the schedule.',
//         conflicts,
//       });
//       return;
//     }

//     // Proceed with creating the schedule if no conflicts
//     const createdLectures = await Lecture.bulkCreate(schedule, { returning: true });
//     res.status(201).json(createdLectures);

//   } catch (err) {
//     console.error('Error generating random schedule:', err);
//     res.status(500).json({ error: 'Error generating random schedule' });
//   }
// });



module.exports = router;
