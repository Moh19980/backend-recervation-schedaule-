const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { sequelize } = require("./models/index");
const lecturersRoutes = require("./routes/lecturers.routes");
const roomsRoutes = require("./routes/rooms.routes");
const lecturesRoutes = require("./routes/lectures.routes");
const stage = require("./routes/stage.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/lecturers", lecturersRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/lectures", lecturesRoutes);
app.use("/api/stages", stage);

// app.get('/test',(req, res) => {
//   res.json({ message: 'API is working!' });
//   res.sendStatus(200);
//   res.send('hellow');
// });
// Start the server
const startServer = async () => {
  try {
    // Sync database
    await sequelize.sync(); // Use { force: true } cautiously in development only

    // Start listening
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`🚀 API ready on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start the server:", error.message);
    process.exit(1); // Exit with failure
  }
};

// Launch the server
startServer();
