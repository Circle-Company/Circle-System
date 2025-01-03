import {
    Association,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from "sequelize"
import User from "./user-model" // Certifique-se de que o modelo User está corretamente exportado

class Statistic extends Model<InferAttributes<Statistic>, InferCreationAttributes<Statistic>> {
    declare id: number
    declare total_followers_num: number
    declare total_likes_num: number
    declare total_views_num: number
    declare total_profile_views_num: number
    declare total_moments_num: number
    declare total_memories_num: number
    declare user_id: bigint

    // Associations
    declare static associations: {
        user: Association<Statistic, User>
    }

    static initialize(sequelize: Sequelize): void {
        Statistic.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                total_followers_num: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                total_likes_num: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                total_views_num: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                total_profile_views_num: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                total_moments_num: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                total_memories_num: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    references: {
                        model: "users",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
            },
            {
                sequelize,
                tableName: "statistics",
                timestamps: false, // Caso você não utilize createdAt e updatedAt
            }
        )
    }

    static associate(models: { User: typeof User }): void {
        Statistic.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }
}

export default Statistic
