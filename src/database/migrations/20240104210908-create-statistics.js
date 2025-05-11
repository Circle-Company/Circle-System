"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("statistics", {
            id: {
                type: Sequelize.INTEGER(),
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.BIGINT(),
                allowNull: false,
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            total_followers_num: {
                type: Sequelize.BIGINT(),
                defaultValue: 0,
            },
            total_likes_num: {
                type: Sequelize.BIGINT(),
                defaultValue: 0,
            },
            total_views_num: {
                type: Sequelize.BIGINT(),
                defaultValue: 0,
            },
            total_profile_views_num: {
                type: Sequelize.BIGINT(),
                defaultValue: 0,
            },
            total_moments_num: {
                type: Sequelize.INTEGER(),
                defaultValue: 0,
            },
            total_memories_num: {
                type: Sequelize.INTEGER(),
                defaultValue: 0,
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
        return queryInterface.dropTable("statistics")
    },
}
