"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("moment_metadatas", {
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
                    model: "moments",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            duration: {
                type: Sequelize.INTEGER(),
                defaultValue: null,
            },
            file_name: {
                type: Sequelize.STRING(),
                defaultValue: null,
            },
            file_size: {
                type: Sequelize.INTEGER(),
                defaultValue: null,
            },
            file_type: {
                type: Sequelize.STRING(),
                defaultValue: null,
            },
            resolution_width: {
                type: Sequelize.INTEGER(),
                defaultValue: null,
            },
            resolution_height: {
                type: Sequelize.INTEGER(),
                defaultValue: null,
            },
            capture_camera_used: {
                type: Sequelize.STRING(),
                allowNull: true,
                defaultValue: null,
            },
            capture_location_name: {
                type: Sequelize.STRING(),
                allowNull: true,
                defaultValue: null,
            },
            capture_coordinates: {
                type: Sequelize.JSON(),
                allowNull: true,
                defaultValue: [],
            },
            has_sensitive_content: {
                type: Sequelize.BOOLEAN(),
                allowNull: false,
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
        await queryInterface.dropTable("moment_metadatas")
    },
}
