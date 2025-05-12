const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const { sequelize }     = require('./models/index');
const lecturersRoutes   = require('./routes/lecturers.routes');
const roomsRoutes       = require('./routes/rooms.routes');
const lecturesRoutes    = require('./routes/lectures.routes');

const app = express();
app.use(cors());
app.use(express.json());

// routes prefix
app.use('/api/lecturers', lecturersRoutes);
app.use('/api/rooms',     roomsRoutes);
app.use('/api/lectures',  lecturesRoutes);

// sync + launch
(async () => {
  await sequelize.sync();        // { force:true } if you want fresh every time
  app.listen(process.env.PORT, () =>
    console.log(`🚀 API ready on http://localhost:${process.env.PORT} Enjoy!`)
  );
})();
