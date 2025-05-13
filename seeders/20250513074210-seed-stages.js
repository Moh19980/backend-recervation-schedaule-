"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Stages', [
      { name: 'stage1', description: 'First Stage', createdAt: new Date(), updatedAt: new Date() },
      { name: 'stage2', description: 'Second Stage', createdAt: new Date(), updatedAt: new Date() },
      { name: 'stage3', description: 'Third Stage', createdAt: new Date(), updatedAt: new Date() },
      { name: 'stage4', description: 'Fourth Stage', createdAt: new Date(), updatedAt: new Date() },
      { name: 'stage5', description: 'Fifth Stage', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Stages', null, {});
  }
};
