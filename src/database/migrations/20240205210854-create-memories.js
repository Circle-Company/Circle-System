"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("memories", {
            id: {
                type: Sequelize.BIGINT(),
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.BIGINT(),
                allowNull: false,
                references: {
                    model: "users", // Certifique-se de ajustar para o nome real da tabela de usuários
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            title: {
                type: Sequelize.STRING(),
                allowNull: false,
            },
            // Adicione outros campos relevantes para as memories
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
        await queryInterface.dropTable("memories")
    },
}
