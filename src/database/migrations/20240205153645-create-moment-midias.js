'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('moment_midias', {
      id: {
        type: Sequelize.INTEGER(),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      moment_id: {
        type: Sequelize.BIGINT(),
        allowNull: false,
        references: {model: 'moments', key: 'id'},
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'  
      },
      content_type: {
        type: Sequelize.STRING(),
        defaultValue: null
      },
      nhd_resolution: {
        type: Sequelize.STRING(),
        defaultValue: null
      },
      fullhd_resolution: {
        type: Sequelize.STRING(),
        defaultValue: null
      },
      created_at: {
        type: Sequelize.DATE(),
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE(),
        allowNull: false
      }
    })
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('moment_midias')
  }
};
