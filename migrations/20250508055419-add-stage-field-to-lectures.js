'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Lectures', 'stage', {
      type: Sequelize.ENUM('stage1', 'stage2', 'stage3', 'stage4'),
      allowNull: false,
      defaultValue: 'stage1',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Lectures', 'stage');
  },
};
