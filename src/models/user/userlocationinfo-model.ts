import { DataTypes, Model, Sequelize } from "sequelize"

interface UserLocationInfoAttributes {
    id?: bigint
    user_id?: bigint
    ip_address?: string
    mac_address?: string
    country?: string
    state?: string
    city?: string
    zone?: string
}

export default class UserLocationInfo
    extends Model<UserLocationInfoAttributes>
    implements UserLocationInfoAttributes
{
    public readonly id!: bigint
    public user_id?: bigint
    public ip_address?: string
    public mac_address?: string
    public country?: string
    public state?: string
    public city?: string
    public zone?: string

    static initialize(sequelize: Sequelize) {
        UserLocationInfo.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                    defaultValue: null,
                },
                ip_address: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                mac_address: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                country: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                state: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                city: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                zone: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
            },
            {
                sequelize,
                modelName: "UserLocationInfo",
                tableName: "user_location_info",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }
}
