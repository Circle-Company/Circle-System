"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("blocks", {
            id: {
                type: Sequelize.INTEGER(),
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.BIGINT(),
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
                defaultValue: null,
            },
            blocked_user_id: {
                type: Sequelize.BIGINT(),
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
                defaultValue: null,
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
        return queryInterface.dropTable("blocks")
    },
}
