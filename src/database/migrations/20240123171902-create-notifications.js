"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("notifications", {
            id: {
                type: Sequelize.INTEGER(),
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            sender_user_id: {
                type: Sequelize.INTEGER(),
                allowNull: false,
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            receiver_user_id: {
                type: Sequelize.INTEGER(),
                allowNull: true,
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            moment_id: {
                type: Sequelize.INTEGER(),
                allowNull: true,
                references: {
                    model: "moments", // Certifique-se de ajustar para o nome real da tabela de moments
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            memory_id: {
                type: Sequelize.INTEGER(),
                allowNull: true,
                references: {
                    model: "memories", // Certifique-se de ajustar para o nome real da tabela de memories
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
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
