'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('moment_tags', {
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
      tag_id: {
        type: Sequelize.BIGINT(),
        allowNull: false,
        references: {
          model: 'tags', // Certifique-se de ajustar para o nome real da tabela de tags
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Adicione outros campos relevantes para a associação entre moments e tags
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
    await queryInterface.dropTable('moment_tags')
  }
};
