"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("tags", {
            id: {
                type: Sequelize.BIGINT(),
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            title: {
                type: Sequelize.STRING(),
                defaultValue: null,
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
        return queryInterface.dropTable("tags")
    },
}
