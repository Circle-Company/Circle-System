"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_preferences", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      disable_autoplay: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      disable_haptics: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      disable_translation: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      translation_language: {
        type: Sequelize.STRING,
        defaultValue: "en",
      },
      app_language: {
        type: Sequelize.STRING,
        defaultValue: "en",
      },
      primary_language: {
        type: Sequelize.STRING,
        defaultValue: "en",
      },
      disable_push_notifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      disable_in_app_notifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("user_preferences");
  },
};
