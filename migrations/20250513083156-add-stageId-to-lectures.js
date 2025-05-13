"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Lectures", "StageId", {
      type: Sequelize.INTEGER,
      allowNull: false, // or true if you want to populate data first
      references: {
        model: "Stages", // Ensure this matches the table name in the database
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });

    // Optionally remove the old ENUM column 'stage'
    await queryInterface.removeColumn("Lectures", "stage");
  },

  async down(queryInterface, Sequelize) {
    // Rollback: remove the new StageId column and re-add the old stage ENUM column
    await queryInterface.removeColumn("Lectures", "StageId");

    await queryInterface.addColumn("Lectures", "stage", {
      type: Sequelize.ENUM("stage1", "stage2", "stage3", "stage4"),
      allowNull: false,
      defaultValue: "stage1",
    });
  },
};
