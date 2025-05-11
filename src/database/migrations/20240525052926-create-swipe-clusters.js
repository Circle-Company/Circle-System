"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_clusters", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            centroid: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            topics: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                defaultValue: [],
            },
            member_ids: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                defaultValue: [],
            },
            active_time_of_day: {
                type: Sequelize.ARRAY(Sequelize.INTEGER),
                defaultValue: [0, 23],
            },
            active_days_of_week: {
                type: Sequelize.ARRAY(Sequelize.INTEGER),
                defaultValue: [0, 1, 2, 3, 4, 5, 6],
            },
            preferred_locations: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                defaultValue: [],
            },
            languages: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                defaultValue: [],
            },
            size: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            density: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_clusters")
    },
} 