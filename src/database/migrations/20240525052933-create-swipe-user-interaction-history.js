"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_user_interaction_history", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                comment: 'ID do usuário',
            },
            entity_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                comment: 'ID da entidade (post)',
            },
            interaction_type: {
                type: Sequelize.ENUM(
                    'short_view',
                    'long_view',
                    'like',
                    'dislike',
                    'share',
                    'comment',
                    'like_comment',
                    'show_less_often',
                    'report',
                    'save',
                    'click'
                ),
                allowNull: false,
                comment: 'Tipo de interação',
            },
            interaction_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                comment: 'Data da interação',
            },
            metadata: {
                type: Sequelize.JSON,
                defaultValue: '{}',
                allowNull: false,
                comment: 'Metadados da interação (duração, percentual visualizado, etc)',
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
            comment: 'Histórico de interações dos usuários para controle de recomendação'
        })

        // Remover índices existentes se houver
        await queryInterface.removeIndex("swipe_user_interaction_history", "idx_swipe_user_interaction_history_user_entity")
        await queryInterface.removeIndex("swipe_user_interaction_history", "idx_swipe_user_interaction_history_user_date")
        await queryInterface.removeIndex("swipe_user_interaction_history", "idx_swipe_user_interaction_history_type")

        // Índices para otimização de consultas
        await queryInterface.addIndex("swipe_user_interaction_history", ["user_id", "entity_id"], {
            name: 'idx_swipe_user_interaction_history_user_entity',
            comment: 'Otimiza consultas por usuário e entidade'
        })

        await queryInterface.addIndex("swipe_user_interaction_history", ["user_id", "interaction_date"], {
            name: 'idx_swipe_user_interaction_history_user_date',
            comment: 'Otimiza consultas por usuário e data'
        })

        await queryInterface.addIndex("swipe_user_interaction_history", ["interaction_type"], {
            name: 'idx_swipe_user_interaction_history_type',
            comment: 'Otimiza filtros por tipo de interação'
        })

        // Criar tabela de agregação para consultas rápidas
        await queryInterface.createTable("swipe_user_interaction_summary", {
            user_id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
                comment: 'ID do usuário',
            },
            total_interactions: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
                comment: 'Total de interações do usuário',
            },
            last_interaction_date: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Data da última interação',
            },
            interaction_counts: {
                type: Sequelize.JSON,
                defaultValue: '{}',
                allowNull: false,
                comment: 'Contadores por tipo de interação',
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
            comment: 'Resumo de interações dos usuários para consultas rápidas'
        })

        // Trigger para manter o resumo atualizado (sintaxe MySQL via Sequelize)
        await queryInterface.sequelize.query(`
            CREATE TRIGGER update_interaction_summary
            AFTER INSERT ON swipe_user_interaction_history
            FOR EACH ROW
            BEGIN
                INSERT INTO swipe_user_interaction_summary (
                    user_id,
                    total_interactions,
                    last_interaction_date,
                    interaction_counts,
                    created_at,
                    updated_at
                )
                VALUES (
                    NEW.user_id,
                    1,
                    NEW.interaction_date,
                    JSON_OBJECT(NEW.interaction_type, 1),
                    NOW(),
                    NOW()
                )
                ON DUPLICATE KEY UPDATE
                    total_interactions = total_interactions + 1,
                    last_interaction_date = GREATEST(last_interaction_date, NEW.interaction_date),
                    interaction_counts = JSON_SET(
                        COALESCE(interaction_counts, '{}'),
                        CONCAT('$.', NEW.interaction_type),
                        COALESCE(
                            JSON_EXTRACT(interaction_counts, CONCAT('$.', NEW.interaction_type)),
                            0
                        ) + 1
                    ),
                    updated_at = NOW();
            END
        `)
    },

    async down(queryInterface, Sequelize) {
        // Remover trigger primeiro
        await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS update_interaction_summary')
        
        // Remover tabelas
        await queryInterface.dropTable("swipe_user_interaction_summary")
        await queryInterface.dropTable("swipe_user_interaction_history")
    },
} 