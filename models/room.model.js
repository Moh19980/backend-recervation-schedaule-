const { DataTypes } = require("sequelize");
const { sequelize } = require("./index");

const Room = sequelize.define("Room", {
  room_name: { type: DataTypes.STRING, allowNull: false, unique: true },
});

module.exports = Room;
