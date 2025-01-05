"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("memory_moments", {
            memory_id: {
                type: Sequelize.INTEGER(),
                allowNull: false,
                references: {
                    model: "memories", // Certifique-se de ajustar para o nome real da tabela de memories
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            moment_id: {
                type: Sequelize.INTEGER(),
                allowNull: false,
                references: {
                    model: "moments", // Certifique-se de ajustar para o nome real da tabela de moments
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            // Adicione outros campos relevantes para a associação entre memories e moments
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
        await queryInterface.dropTable("memory_moments")
    },
}
