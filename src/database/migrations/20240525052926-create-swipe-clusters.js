"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_clusters", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            centroid: {
                type: Sequelize.TEXT,
                allowNull: false,
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
                comment: 'Array de IDs de membros em formato JSON',
            },
            active_time_of_day: {
                type: Sequelize.TEXT,
                defaultValue: JSON.stringify([0, 23]),
                allowNull: false,
                comment: 'Array de horários ativos em formato JSON',
            },
            active_days_of_week: {
                type: Sequelize.TEXT,
                defaultValue: JSON.stringify([0, 1, 2, 3, 4, 5, 6]),
                allowNull: false,
                comment: 'Array de dias ativos em formato JSON',
            },
            preferred_locations: {
                type: Sequelize.TEXT,
                defaultValue: JSON.stringify([]),
                allowNull: false,
                comment: 'Array de localizações preferidas em formato JSON',
            },
            languages: {
                type: Sequelize.TEXT,
                defaultValue: JSON.stringify([]),
                allowNull: false,
                comment: 'Array de idiomas em formato JSON',
            },
            size: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            density: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
                allowNull: false,
            },
            metadata: {
                type: Sequelize.JSON,
                defaultValue: {},
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
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
            engine: 'InnoDB'
        })

        // Adicionar índices para melhorar performance
        await queryInterface.addIndex("swipe_clusters", ["name"], {
            name: 'idx_swipe_clusters_name'
        })
        await queryInterface.addIndex("swipe_clusters", ["size"], {
            name: 'idx_swipe_clusters_size'
        })
        await queryInterface.addIndex("swipe_clusters", ["density"], {
            name: 'idx_swipe_clusters_density'
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_clusters")
    },
} 