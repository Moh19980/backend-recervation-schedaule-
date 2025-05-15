const express = require("express");
const router = express.Router();
const Stage = require("../models/stage.model");

// GET all stages
router.get("/", async (req, res) => {
  try {
    // this is line of code is to get all stages from the database
    // and send them as a JSON response
    const stages = await Stage.findAll();
    res.json(stages);
  } catch (err) {
    console.error("Error fetching stages:", err);
    res.status(500).json({ error: "Error fetching stages" });
  }
});
// POST create a new stage
router.post("/", async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Stage name is required" });
  }

  try {
    const newStage = await Stage.create({ name, description });
    res.status(201).json(newStage);
  } catch (err) {
    console.error("Error creating stage:", err);
    res.status(500).json({ error: "Error creating stage" });
  }
});
// DELETE a stage by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const stage = await Stage.findByPk(id);

    if (!stage) {
      return res.status(404).json({ error: "Stage not found" });
    }

    await stage.destroy();
    res.json({ message: "Stage deleted successfully" });
  } catch (err) {
    console.error("Error deleting stage:", err);
    res.status(500).json({ error: "Error deleting stage" });
  }
});

module.exports = router;
