const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Lecturer = sequelize.define('Lecturer', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  day_offs: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
});

module.exports = Lecturer;
