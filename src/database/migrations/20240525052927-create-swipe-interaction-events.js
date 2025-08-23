"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_interaction_events", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.STRING(36),
                allowNull: false,
                comment: 'ID do usuário que realizou a interação',
            },
            entity_id: {
                type: Sequelize.STRING(36),
                allowNull: false,
                comment: 'ID da entidade com que houve interação',
            },
            entity_type: {
                type: Sequelize.ENUM('user', 'post'),
                allowNull: false,
                comment: 'Tipo da entidade (user ou post)',
            },
            type: {
                type: Sequelize.ENUM(
                    'short_view',
                    'long_view',
                    'like',
                    'dislike',
                    'share',
                    'comment',
                    'like_comment',
                    'show_less_often',
                    'report'
                ),
                allowNull: false,
                comment: 'Tipo da interação',
            },
            timestamp: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            metadata: {
                type: Sequelize.JSON,
                defaultValue: {},
                allowNull: false,
                comment: 'Metadados adicionais da interação',
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
            comment: 'Registra eventos de interação dos usuários com entidades'
        })

        // Adicionar índices com nomes explícitos
        await queryInterface.addIndex("swipe_interaction_events", ["user_id"], {
            name: 'idx_swipe_interaction_events_user_id'
        })
        await queryInterface.addIndex("swipe_interaction_events", ["entity_id", "entity_type"], {
            name: 'idx_swipe_interaction_events_entity'
        })
        await queryInterface.addIndex("swipe_interaction_events", ["timestamp"], {
            name: 'idx_swipe_interaction_events_timestamp'
        })
        await queryInterface.addIndex("swipe_interaction_events", ["type"], {
            name: 'idx_swipe_interaction_events_type'
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_interaction_events")
    },
} 