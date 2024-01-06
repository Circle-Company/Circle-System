'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(30),
      },
      encrypted_password: {
        type: Sequelize.STRING(100),
        allowNull: false
      },      
      description: {
        type: Sequelize.STRING(300)
      },
      access_level: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      verifyed: {
        type: Sequelize.BOOLEAN(),
        allowNull: false
      },
      deleted: {
        type: Sequelize.BOOLEAN(),
        allowNull: false
      },
      blocked: {
        type: Sequelize.BOOLEAN(),
        allowNull: false
      },
      muted: {
        type: Sequelize.BOOLEAN(),
        allowNull: false
      },      
      terms_and_conditions_agreed_version: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      terms_and_conditions_agreed_at: {
        type: Sequelize.DATE(),
        allowNull: false
      },
      last_active_at: {
        type: Sequelize.DATE(),
        allowNull: false
      },
      send_notification_emails: {
        type: Sequelize.BOOLEAN(),
        allowNull: false
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
    return queryInterface.dropTable('users')
  }
};
