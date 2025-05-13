const express = require('express');
const router = express.Router();
const Stage = require('../models/stage.model');

// GET all stages
router.get('/', async (req, res) => {
  try {
    const stages = await Stage.findAll();
    res.json(stages);
  } catch (err) {
    console.error('Error fetching stages:', err);
    res.status(500).json({ error: 'Error fetching stages' });
  }
});

module.exports = router;
