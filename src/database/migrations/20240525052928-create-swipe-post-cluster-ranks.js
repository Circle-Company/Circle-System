"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_post_cluster_ranks", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            post_id: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            cluster_id: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            score: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            similarity: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            relevance_score: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            engagement_score: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            last_updated: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
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

        // Adicionar índices
        await queryInterface.addIndex("swipe_post_cluster_ranks", ["post_id", "cluster_id"], {
            unique: true,
        })
        await queryInterface.addIndex("swipe_post_cluster_ranks", ["score"])
        await queryInterface.addIndex("swipe_post_cluster_ranks", ["cluster_id", "is_active", "score"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_post_cluster_ranks")
    },
} 