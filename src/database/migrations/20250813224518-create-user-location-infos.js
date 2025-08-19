"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("user-location-infos", {
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
            ip_address: {
                type: Sequelize.STRING(),
                allowNull: true,
                defaultValue: null,
            },
            mac_address: {
                type: Sequelize.STRING(),
                allowNull: true,
                defaultValue: null,
            },
            country: {
                type: Sequelize.STRING(),
                allowNull: true,
                defaultValue: null,
            },
            state: {
                type: Sequelize.STRING(),
                allowNull: true,
                defaultValue: null,
            },
            city: {
                type: Sequelize.STRING(),
                allowNull: true,
                defaultValue: null,
            },
            zone: {
                type: Sequelize.STRING(),
                allowNull: true,
                defaultValue: null,
            },
        })
    },

    async down(queryInterface, Sequelize) {
        return queryInterface.dropTable("user-location-infos")
    },
}
