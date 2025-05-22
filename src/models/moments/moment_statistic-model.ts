import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize"

import type { Sequelize } from "sequelize"

interface MomentStatisticAttributes {
    moment_id: bigint
    total_likes_num: number
    total_views_num: number
    total_shares_num: number
    total_comments_num: number
    is_trend: boolean
    total_reports_num: number
    total_skips_num: number
    total_profile_clicks_num: number
}

export default class MomentStatistic extends Model<InferAttributes<MomentStatistic>, InferCreationAttributes<MomentStatistic>> implements MomentStatisticAttributes {
    declare moment_id: bigint
    declare total_likes_num: CreationOptional<number>
    declare total_views_num: CreationOptional<number>
    declare total_shares_num: CreationOptional<number>
    declare total_comments_num: CreationOptional<number>
    declare is_trend: CreationOptional<boolean>
    declare total_reports_num: CreationOptional<number>
    declare total_skips_num: CreationOptional<number>
    declare total_profile_clicks_num: CreationOptional<number>

    static initialize(sequelize: Sequelize) {
        const attributes = {
            moment_id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: "moments",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            total_likes_num: {
                type: DataTypes.BIGINT,
                allowNull: false,
                defaultValue: 0,
            },
            total_views_num: {
                type: DataTypes.BIGINT,
                allowNull: false,
                defaultValue: 0,
            },
            total_shares_num: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            total_comments_num: {
                type: DataTypes.BIGINT,
                allowNull: false,
                defaultValue: 0,
            },
            is_trend: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            total_reports_num: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            total_skips_num: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            total_profile_clicks_num: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        }

        const options = {
            sequelize,
            modelName: "MomentStatistic",
            tableName: "moment_statistics",
            timestamps: true,
        }

        return MomentStatistic.init(attributes, options)
    }

    static associate(models: any) {
        MomentStatistic.belongsTo(models.Moment, { foreignKey: "moment_id", as: "moment" })
    }
} 