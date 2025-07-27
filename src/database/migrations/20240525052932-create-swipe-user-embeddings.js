"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_user_embeddings", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                comment: 'ID do usuário associado ao embedding',
            },
            vector: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'Vetor de embedding em formato JSON',
            },
            dimension: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 128,
                comment: 'Dimensão do vetor de embedding',
            },
            metadata: {
                type: Sequelize.JSON,
                defaultValue: {},
                allowNull: false,
                comment: 'Metadados adicionais do embedding',
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
            comment: 'Armazena embeddings vetoriais de usuários para recomendação'
        })

        // Adicionar índice único para user_id
        await queryInterface.addIndex("swipe_user_embeddings", ["user_id"], {
            unique: true,
            name: 'idx_swipe_user_embeddings_user_id_unique'
        })

        // Adicionar índice para dimension para consultas de filtro
        await queryInterface.addIndex("swipe_user_embeddings", ["dimension"], {
            name: 'idx_swipe_user_embeddings_dimension'
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_user_embeddings")
    },
} 