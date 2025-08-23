"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_post_embeddings", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: false,
                allowNull: false,
            },
            post_id: {
                type: Sequelize.STRING(36),
                allowNull: false,
                comment: 'ID do post associado ao embedding',
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
            comment: 'Armazena embeddings vetoriais de posts para recomendação'
        })

        // Adicionar índice único para post_id
        await queryInterface.addIndex("swipe_post_embeddings", ["post_id"], {
            unique: true,
            name: 'idx_swipe_post_embeddings_post_id_unique'
        })

        // Adicionar índice para dimension para consultas de filtro
        await queryInterface.addIndex("swipe_post_embeddings", ["dimension"], {
            name: 'idx_swipe_post_embeddings_dimension'
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_post_embeddings")
    },
} 