'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('moment_comments_statistics', {
      id: {
        type: Sequelize.INTEGER(),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      comment_id: {
        type: Sequelize.INTEGER(),
        allowNull: false,
        unique: true,
        references: {
          model: 'moment_comments', // Certifique-se de ajustar para o nome real da tabela de moment_comments
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      total_likes_num: {
        type: Sequelize.INTEGER(),
        defaultValue: 0,
      },
      total_replies_num: {
        type: Sequelize.INTEGER(),
        defaultValue: 0,
      },
      total_reports_num: {
        type: Sequelize.INTEGER(),
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE(),
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE(),
        allowNull: false,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('moment_comments_statistics');
  }
};
