"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("users", {
            id: {
                type: Sequelize.BIGINT(),
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            username: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(30),
                defaultValue: null,
            },
            encrypted_password: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            old_encrypted_password: {
                type: Sequelize.STRING(100),
                defaultValue: null,
            },
            description: {
                type: Sequelize.STRING(300),
                defaultValue: null,
            },
            access_level: {
                type: Sequelize.INTEGER(1),
                defaultValue: 0,
                allowNull: false,
            },
            verifyed: {
                type: Sequelize.BOOLEAN(),
                defaultValue: 0,
                allowNull: false,
            },
            deleted: {
                type: Sequelize.BOOLEAN(),
                defaultValue: false,
                allowNull: false,
            },
            blocked: {
                type: Sequelize.BOOLEAN(),
                defaultValue: false,
                allowNull: false,
            },
            muted: {
                type: Sequelize.BOOLEAN(),
                defaultValue: false,
                allowNull: false,
            },
            terms_and_conditions_agreed_version: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            terms_and_conditions_agreed_at: {
                type: Sequelize.DATE(),
                allowNull: false,
            },
            last_active_at: {
                type: Sequelize.DATE(),
                allowNull: false,
            },
            last_login_at: {
                type: Sequelize.DATE(),
                allowNull: false,
            },
            last_failed_login_at: {
                type: Sequelize.DATE(),
            },
            last_password_updated_at: {
                type: Sequelize.DATE(),
            },
            send_notification_emails: {
                type: Sequelize.BOOLEAN(),
                allowNull: false,
                defaultValue: false,
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
        return queryInterface.dropTable("users")
    },
}
