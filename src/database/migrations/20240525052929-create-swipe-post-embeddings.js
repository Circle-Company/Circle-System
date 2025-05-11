"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_post_embeddings", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
            },
            post_id: {
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

        // Adicionar índice único para post_id
        await queryInterface.addIndex("swipe_post_embeddings", ["post_id"], {
            unique: true,
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_post_embeddings")
    },
} 