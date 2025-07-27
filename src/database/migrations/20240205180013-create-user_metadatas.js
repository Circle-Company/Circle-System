'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('user_metadatas', {
      id: {
        type: Sequelize.INTEGER(),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      device_type: {
        type: Sequelize.STRING(),
        defaultValue: null,
      },
      device_name: {
        type: Sequelize.STRING(),
        defaultValue: null,
      },
      device_id: {
        type: Sequelize.STRING(),
        defaultValue: null,
      },
      device_token: {
        type: Sequelize.STRING(),
        defaultValue: null,
      },
      os_version: {
        type: Sequelize.STRING(),
        defaultValue: null,
      },
      screen_resolution_width: {
        type: Sequelize.INTEGER(),
        defaultValue: null,
      },
      screen_resolution_height: {
        type: Sequelize.INTEGER(),
        defaultValue: null,
      },
      os_language: {
        type: Sequelize.STRING(),
        defaultValue: null,
      },
      total_device_memory: {
        type: Sequelize.STRING(),
        defaultValue: null,
      },
      has_notch: {
        type: Sequelize.STRING(),
        defaultValue: null,
      },
      unique_id: {
        type: Sequelize.STRING(),
        defaultValue: null,
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
    await queryInterface.dropTable('user_metadatas');
  }
};
