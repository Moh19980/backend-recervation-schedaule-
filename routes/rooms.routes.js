const router = require('express').Router();
const Room = require('../models/room.model');

// GET all
router.get('/', async (_, res) => res.json(await Room.findAll()));

// POST create
router.post('/', async (req, res) => {
  const room = await Room.create({ room_name: req.body.room_name });
  res.status(201).json(room);
});

module.exports = router;

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const room = await Room.destroy({ where: { id } });
  if (room) {
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Room not found Please Try again later' });
  }
});