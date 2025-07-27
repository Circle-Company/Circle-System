"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("contacts", {
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
            phone_number: Sequelize.INTEGER(9),
            country_prefix: Sequelize.INTEGER(3),
            state_prefix: Sequelize.INTEGER(3),
            phone_last_updated_at: {
                type: Sequelize.DATE(),
            },
            email: Sequelize.STRING(),
            email_last_updated_at: {
                type: Sequelize.DATE(),
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
        return queryInterface.dropTable("contacts")
    },
}
