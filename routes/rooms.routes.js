const router = require('express').Router();
const Room = require('../models/room.model');

// GET all
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.findAll();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    if (!req.body.room_name) {
      return res.status(400).json({ error: 'room_name is required' });
    }
    const room = await Room.create({ room_name: req.body.room_name });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// DELETE by id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Room.destroy({ where: { id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Room not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;