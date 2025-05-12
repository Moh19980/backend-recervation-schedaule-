const router = require('express').Router();
const Lecturer = require('../models/lecturer.model');

// Valid days of the week
const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

// GET All Lecturers
router.get('/', async (req, res) => {
  try {
    const lecturers = await Lecturer.findAll();
    res.json(lecturers);
  } catch (err) {
    console.error('Error fetching lecturers:', err);
    res.status(500).json({ error: 'Error fetching lecturers' });
  }
});

// POST - Add a New Lecturer
router.post('/', async (req, res) => {
  const { name, day_offs } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!Array.isArray(day_offs)) {
    return res.status(400).json({ error: 'day_offs must be an array' });
  }

  // Validate day_offs values
  const invalidDays = day_offs.filter(day => !validDays.includes(day));
  if (invalidDays.length > 0) {
    return res.status(400).json({ error: `Invalid day(s): ${invalidDays.join(', ')}` });
  }

  try {
    const newLecturer = await Lecturer.create({ name, day_offs });
    res.status(201).json(newLecturer);
  } catch (err) {
    console.error('Error creating lecturer:', err);
    res.status(500).json({ error: 'Error creating lecturer' });
  }
});

// DELETE - Remove a Lecturer
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const lecturer = await Lecturer.findByPk(id);
    if (!lecturer) {
      return res.status(404).json({ error: 'Lecturer not found' });
    }

    await lecturer.destroy();
    res.json({ message: 'Lecturer deleted successfully' });
  } catch (err) {
    console.error('Error deleting lecturer:', err);
    res.status(500).json({ error: 'Error deleting lecturer' });
  }
});




// Update Lecturer Day Offs
router.put('/:id/day-offs', async (req, res) => {
  const { id } = req.params;
  const { day_offs } = req.body;

  if (!Array.isArray(day_offs)) {
    return res.status(400).json({ error: 'day_offs must be an array' });
  }


  const invalidDays = day_offs.filter(day => !validDays.includes(day));
  if (invalidDays.length > 0) {
    return res.status(400).json({ error: `Invalid day(s): ${invalidDays.join(', ')}` });
  }

  try {
    const lecturer = await Lecturer.findByPk(id);
    if (!lecturer) {
      return res.status(404).json({ error: 'Lecturer not found' });
    }

    lecturer.day_offs = day_offs;
    await lecturer.save();
    res.json(lecturer);
  } catch (err) {
    console.error('Error updating day_offs:', err);
    res.status(500).json({ error: 'Error updating day_offs' });
  }
});

module.exports = router;
