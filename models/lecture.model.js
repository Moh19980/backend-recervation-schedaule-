const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("./index");
const Room = require("./room.model");
const Lecturer = require("./lecturer.model");
const Stage = require("./stage.model");

const Lecture = sequelize.define("Lecture", {
  course_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  day_of_week: {
    type: DataTypes.ENUM(
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday"
    ),
    allowNull: false,
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  hours_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// M:N (many lecturers can teach a lecture, a lecturer teaches many lectures)
Lecture.belongsToMany(Lecturer, { through: "LectureLecturers" });
Lecturer.belongsToMany(Lecture, { through: "LectureLecturers" });

// 1:N (one room hosts many lectures)
Lecture.belongsTo(Room);
Room.hasMany(Lecture);

// 1:N (One stage can have many lectures)
Lecture.belongsTo(Stage);
Stage.hasMany(Lecture);

module.exports = { Lecture, Op };
