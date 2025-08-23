'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('moment_statistics', {
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
      is_trend: {
        type: Sequelize.BOOLEAN(),
        defaultValue: false,
        allowNull: false
      },
      total_likes_num: {
        type: Sequelize.BIGINT(),
        defaultValue: 0
      },
      total_views_num: {
        type: Sequelize.BIGINT(),
        defaultValue: 0
      },
      total_shares_num: {
        type: Sequelize.INTEGER(),
        defaultValue: 0
      },
      total_reports_num: {
        type: Sequelize.INTEGER(),
        defaultValue: 0
      },
      total_skips_num: {
        type: Sequelize.INTEGER(),
        defaultValue: 0
      },
      total_comments_num: {
        type: Sequelize.BIGINT(),
        defaultValue: 0
      },
      total_profile_clicks_num: {
        type: Sequelize.INTEGER(),
        defaultValue: 0
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
    return queryInterface.dropTable('moment_statistics')
  }
};
