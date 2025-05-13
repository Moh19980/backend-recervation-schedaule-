'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Lectures', 'StageId', {
      type: Sequelize.INTEGER,
      allowNull: false,  // or true if you want to allow null for testing
      references: {
        model: 'Stages',  // Must match the table name exactly
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    // Optional: Remove the old `stage` column if it exists
    await queryInterface.removeColumn('Lectures', 'stage');
  },

  async down(queryInterface, Sequelize) {
    // Rollback: remove the `StageId` column
    await queryInterface.removeColumn('Lectures', 'StageId');

    // Optionally, reintroduce the old `stage` column
    await queryInterface.addColumn('Lectures', 'stage', {
      type: Sequelize.ENUM('stage1', 'stage2', 'stage3', 'stage4'),
      allowNull: false,
      defaultValue: 'stage1',
    });
  },
};
