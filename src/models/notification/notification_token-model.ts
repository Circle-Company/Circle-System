import { DataTypes, Model, Sequelize } from "sequelize"

interface NotificationTokenAttributes {
    id?: bigint
    user_id: bigint
    token: string
}

export default class NotificationToken extends Model<NotificationTokenAttributes> implements NotificationTokenAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public token!: string

    static initialize(sequelize: Sequelize) {
        NotificationToken.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                token: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "NotificationToken",
                tableName: "notification_tokens",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
        })
    }
} 