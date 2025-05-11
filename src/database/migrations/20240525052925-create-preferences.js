"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("preferences", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            app_timezone: {
                type: Sequelize.INTEGER,
                defaultValue: -3,
            },
            app_language: {
                type: Sequelize.STRING,
                defaultValue: "en",
            },
            translation_language: {
                type: Sequelize.STRING,
                defaultValue: "en",
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
            disable_like_moment_push_notification: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            disable_new_memory_push_notification: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            disable_add_to_memory_push_notification: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            disable_follow_user_push_notification: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            disable_view_user_push_notification: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            disable_news_push_notification: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            disable_sugestions_push_notification: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            disable_around_you_push_notification: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            created_at: {
                type: Sequelize.DATE(),
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE(),
                allowNull: false,
            },
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("preferences")
    },
}
