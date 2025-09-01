'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Lectures', 'hours_number', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1, // Default value for existing records
      after: 'end_time'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Lectures', 'hours_number');
  }
};
