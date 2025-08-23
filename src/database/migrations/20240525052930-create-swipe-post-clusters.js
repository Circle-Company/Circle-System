"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_post_clusters", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Nome do cluster',
            },
            centroid: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'Centroide do cluster em formato JSON',
            },
            topics: {
                type: Sequelize.TEXT,
                defaultValue: JSON.stringify([]),
                allowNull: false,
                comment: 'Array de tópicos em formato JSON',
            },
            member_ids: {
                type: Sequelize.TEXT,
                defaultValue: JSON.stringify([]),
                allowNull: false,
                comment: 'Array de IDs de posts membros em formato JSON',
            },
            category: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'general',
                comment: 'Categoria do cluster',
            },
            tags: {
                type: Sequelize.TEXT,
                defaultValue: JSON.stringify([]),
                allowNull: false,
                comment: 'Array de tags em formato JSON',
            },
            size: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
                comment: 'Número de membros no cluster',
            },
            density: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
                allowNull: false,
                comment: 'Densidade do cluster',
            },
            avg_engagement: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
                allowNull: false,
                comment: 'Engajamento médio dos posts no cluster',
            },
            metadata: {
                type: Sequelize.JSON,
                defaultValue: {},
                allowNull: false,
                comment: 'Metadados adicionais do cluster',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
            engine: 'InnoDB',
            comment: 'Armazena clusters de posts para recomendação'
        })

        // Adicionar índices para melhorar performance
        await queryInterface.addIndex("swipe_post_clusters", ["name"], {
            name: 'idx_swipe_post_clusters_name'
        })
        await queryInterface.addIndex("swipe_post_clusters", ["category"], {
            name: 'idx_swipe_post_clusters_category'
        })
        await queryInterface.addIndex("swipe_post_clusters", ["size"], {
            name: 'idx_swipe_post_clusters_size'
        })
        await queryInterface.addIndex("swipe_post_clusters", ["density"], {
            name: 'idx_swipe_post_clusters_density'
        })
        await queryInterface.addIndex("swipe_post_clusters", ["avg_engagement"], {
            name: 'idx_swipe_post_clusters_engagement'
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_post_clusters")
    },
} 