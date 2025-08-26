"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("subscription_validation_logs", {
            id: {
                type: Sequelize.BIGINT(),
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.BIGINT(),
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            subscription_id: {
                type: Sequelize.BIGINT(),
                allowNull: true,
                references: {
                    model: 'user_subscriptions',
                    key: 'id'
                },
                onDelete: 'SET NULL'
            },
            purchase_token: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'Token da compra validada'
            },
            validation_type: {
                type: Sequelize.ENUM('purchase', 'renewal', 'webhook', 'manual', 'scheduled'),
                allowNull: false,
                comment: 'Tipo de validação realizada'
            },
            validation_result: {
                type: Sequelize.ENUM('success', 'failure', 'error'),
                allowNull: false,
                comment: 'Resultado da validação'
            },
            google_response: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Resposta completa do Google Play API'
            },
            error_message: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Mensagem de erro, se houver'
            },
            error_code: {
                type: Sequelize.STRING(50),
                allowNull: true,
                comment: 'Código de erro específico'
            },
            response_time_ms: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Tempo de resposta da API em milissegundos'
            },
            ip_address: {
                type: Sequelize.STRING(45),
                allowNull: true,
                comment: 'IP do cliente que iniciou a validação'
            },
            user_agent: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'User-Agent do cliente'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        }).then(() => {
            // Criar índices para performance
            return Promise.all([
                queryInterface.addIndex('subscription_validation_logs', ['user_id'], {
                    name: 'idx_subscription_validation_logs_user_id'
                }),
                queryInterface.addIndex('subscription_validation_logs', ['subscription_id'], {
                    name: 'idx_subscription_validation_logs_subscription_id'
                }),
                queryInterface.addIndex('subscription_validation_logs', ['purchase_token'], {
                    name: 'idx_subscription_validation_logs_purchase_token'
                }),
                queryInterface.addIndex('subscription_validation_logs', ['validation_type'], {
                    name: 'idx_subscription_validation_logs_validation_type'
                }),
                queryInterface.addIndex('subscription_validation_logs', ['validation_result'], {
                    name: 'idx_subscription_validation_logs_validation_result'
                }),
                queryInterface.addIndex('subscription_validation_logs', ['created_at'], {
                    name: 'idx_subscription_validation_logs_created_at'
                }),
                queryInterface.addIndex('subscription_validation_logs', ['error_code'], {
                    name: 'idx_subscription_validation_logs_error_code'
                }),
                // Índices compostos
                queryInterface.addIndex('subscription_validation_logs', ['user_id', 'validation_result'], {
                    name: 'idx_subscription_validation_logs_user_result'
                }),
                queryInterface.addIndex('subscription_validation_logs', ['created_at', 'validation_type'], {
                    name: 'idx_subscription_validation_logs_date_type'
                })
            ])
        })
    },

    async down(queryInterface, Sequelize) {
        return queryInterface.dropTable("subscription_validation_logs")
    }
}
