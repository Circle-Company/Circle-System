"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable("user_subscriptions", {
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
            purchase_token: {
                type: Sequelize.TEXT,
                allowNull: false,
                unique: true,
                comment: 'Token único da compra no Google Play'
            },
            product_id: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: 'ID do produto (circle_premium_monthly, etc.)'
            },
            order_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
                comment: 'ID único do pedido'
            },
            status: {
                type: Sequelize.ENUM('active', 'canceled', 'expired', 'paused', 'pending'),
                allowNull: false,
                defaultValue: 'pending'
            },
            purchased_at: {
                type: Sequelize.DATE,
                allowNull: false,
                comment: 'Data da compra original'
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Data de expiração da assinatura'
            },
            starts_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Data de início da assinatura'
            },
            acknowledgment_state: {
                type: Sequelize.ENUM('yet_to_be_acknowledged', 'acknowledged'),
                allowNull: false,
                defaultValue: 'yet_to_be_acknowledged'
            },
            auto_renewing: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            price_amount_micros: {
                type: Sequelize.BIGINT,
                allowNull: false,
                comment: 'Preço em micros (divide por 1.000.000 para obter valor real)'
            },
            price_currency_code: {
                type: Sequelize.STRING(3),
                allowNull: false,
                defaultValue: 'BRL'
            },
            country_code: {
                type: Sequelize.STRING(2),
                allowNull: false,
                defaultValue: 'BR'
            },
            payment_state: {
                type: Sequelize.ENUM('payment_pending', 'payment_received', 'free_trial', 'pending_deferred'),
                allowNull: false,
                defaultValue: 'payment_pending'
            },
            cancel_reason: {
                type: Sequelize.ENUM('none', 'user_canceled', 'system_canceled', 'replaced', 'developer_canceled'),
                allowNull: true,
                defaultValue: 'none'
            },
            original_json: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'JSON original retornado pelo Google Play'
            },
            last_validated_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Última vez que a assinatura foi validada'
            },
            validation_attempts: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Número de tentativas de validação'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        }).then(() => {
            // Criar índices para performance
            return Promise.all([
                queryInterface.addIndex('user_subscriptions', ['user_id'], {
                    name: 'idx_user_subscriptions_user_id'
                }),
                queryInterface.addIndex('user_subscriptions', ['status'], {
                    name: 'idx_user_subscriptions_status'
                }),
                queryInterface.addIndex('user_subscriptions', ['expires_at'], {
                    name: 'idx_user_subscriptions_expires_at'
                }),
                queryInterface.addIndex('user_subscriptions', ['product_id'], {
                    name: 'idx_user_subscriptions_product_id'
                }),
                queryInterface.addIndex('user_subscriptions', ['created_at'], {
                    name: 'idx_user_subscriptions_created_at'
                })
            ])
        })
    },

    async down(queryInterface, Sequelize) {
        return queryInterface.dropTable("user_subscriptions")
    }
}
