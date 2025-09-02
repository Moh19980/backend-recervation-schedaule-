"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Lectures", "start_time", {
      type: Sequelize.TIME,
      allowNull: true,
    });
    await queryInterface.changeColumn("Lectures", "end_time", {
      type: Sequelize.TIME,
      allowNull: true,
    });
    await queryInterface.changeColumn("Lectures", "day_of_week", {
      type: Sequelize.ENUM("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Lectures", "start_time", {
      type: Sequelize.TIME,
      allowNull: false,
    });
    await queryInterface.changeColumn("Lectures", "end_time", {
      type: Sequelize.TIME,
      allowNull: false,
    });
    await queryInterface.changeColumn("Lectures", "day_of_week", {
      type: Sequelize.ENUM("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"),
      allowNull: false,
    });
  },
};
