"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_user_embeddings", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            vector: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            dimension: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 128,
            },
            metadata: {
                type: Sequelize.JSONB,
                defaultValue: {},
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

        // Adicionar índice único para user_id
        await queryInterface.addIndex("swipe_user_embeddings", ["user_id"], {
            unique: true,
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_user_embeddings")
    },
} 