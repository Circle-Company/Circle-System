"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("moments", {
            id: {
                type: Sequelize.BIGINT(),
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.BIGINT(),
                allowNull: false,
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            description: {
                type: Sequelize.STRING(300),
                defaultValue: null,
            },
            visible: {
                type: Sequelize.BOOLEAN(),
                defaultValue: true,
                allowNull: false,
            },
            deleted: {
                type: Sequelize.BOOLEAN(),
                defaultValue: false,
                allowNull: false,
            },
            blocked: {
                type: Sequelize.BOOLEAN(),
                defaultValue: false,
                allowNull: false,
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
        return queryInterface.dropTable("moments")
    },
}
