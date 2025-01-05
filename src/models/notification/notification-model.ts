import { DataTypes, Model, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

class Notification extends Model {
    public readonly id!: number
    public sender_user_id!: number
    public receiver_user_id!: number
    public moment_id!: number
    public memory_id!: number
    public viewed!: boolean
    public type!: string

    static initialize(sequelize: Sequelize): typeof Notification {
        return Notification.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => snowflake.generate(),
                },
                sender_user_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                receiver_user_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                moment_id: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                memory_id: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                viewed: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                },
                type: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "Notification",
                tableName: "notifications",
                timestamps: true, // Adicione caso precise de `createdAt` e `updatedAt`
            }
        )
    }

    static associate(models: any): void {
        this.belongsTo(models.User, {
            foreignKey: "sender_user_id",
            as: "sender",
        })

        this.belongsTo(models.User, {
            foreignKey: "receiver_user_id",
            as: "receiver",
        })
    }
}

export default Notification
