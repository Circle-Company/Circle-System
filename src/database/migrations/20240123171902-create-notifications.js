"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("notifications", {
            id: {
                type: Sequelize.BIGINT(),
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            sender_user_id: {
                type: Sequelize.BIGINT(),
                allowNull: false,
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            receiver_user_id: {
                type: Sequelize.BIGINT(),
                allowNull: true,
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            moment_id: {
                type: Sequelize.BIGINT(),
                allowNull: true,
            },
            memory_id: {
                type: Sequelize.BIGINT(),
                allowNull: true,
            },
            viewed: {
                type: Sequelize.BOOLEAN(),
                defaultValue: false,
                allowNull: false,
            },
            type: {
                type: Sequelize.STRING(),
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        })
    },

    async down(queryInterface, Sequelize) {
        return queryInterface.dropTable("notifications")
    },
}
