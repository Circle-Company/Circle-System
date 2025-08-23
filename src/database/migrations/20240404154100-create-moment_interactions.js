'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('moment_interactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.BIGINT(),
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      moment_owner_id: {
        type: Sequelize.BIGINT(),
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      moment_id: {
        type: Sequelize.BIGINT(),
        allowNull: false,
        references: { model: 'moments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      like: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      share: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      click_into_moment: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      watch_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      click_profile: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      comment: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      like_comment: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      pass_to_next: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      show_less_often: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      report: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      negative_interaction_rate: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
        allowNull: false,
      },
      positive_interaction_rate: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE(),
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE(),
        allowNull: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('moment_interactions')
  }
};
