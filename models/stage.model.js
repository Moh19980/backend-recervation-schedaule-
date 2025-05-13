const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Stage = sequelize.define('Stage', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Stage;
