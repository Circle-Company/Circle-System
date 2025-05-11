'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('moment_comments', {
      id: {
        type: Sequelize.INTEGER(),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      moment_id: {
        type: Sequelize.BIGINT(),
        allowNull: false,
        references: {
          model: 'moments', // Certifique-se de ajustar para o nome real da tabela de moments
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.BIGINT(),
        allowNull: false,
        references: {
          model: 'users', // Certifique-se de ajustar para o nome real da tabela de usuários
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      content: {
        type: Sequelize.STRING(),
        allowNull: false,
      },
      parent_comment_id: {
        type: Sequelize.INTEGER(),
        allowNull: true,
        references: {
          model: 'moment_comments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Adicione outros campos relevantes para os comentários dos moments
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
    await queryInterface.dropTable('moment_comments');
  }
};
