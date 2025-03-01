import User from "models/user/user-model"
import { DataTypes, Model, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

class Preference extends Model {
    public readonly id!: bigint
    public app_timezone!: number
    public app_language!: string
    public disable_autoplay!: boolean
    public disable_haptics!: boolean
    public disable_translation!: boolean
    public translation_language!: string
    public disable_like_moment_push_notification!: boolean
    public disable_new_memory_push_notification!: boolean
    public disable_add_to_memory_push_notification!: boolean
    public disable_follow_user_push_notification!: boolean
    public disable_view_user_push_notification!: boolean
    public disable_news_push_notification!: boolean
    public disable_sugestions_push_notification!: boolean
    public disable_around_you_push_notification!: boolean
    public user_id!: bigint

    static initialize(sequelize: Sequelize) {
        return Preference.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => snowflake.generate(),
                },
                app_timezone: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                app_language: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                disable_autoplay: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_haptics: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_translation: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                translation_language: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                disable_like_moment_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_new_memory_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_add_to_memory_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_follow_user_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_view_user_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_news_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_sugestions_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_around_you_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
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
                modelName: "Preference",
                tableName: "preferences",
                timestamps: true, // Inclui createdAt e updatedAt
            }
        )
    }

    static associate(models: { User: typeof User }): void {
        Preference.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }
}

export default Preference
