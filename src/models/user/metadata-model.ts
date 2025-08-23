import { DataTypes, Model, Sequelize } from "sequelize"

interface UserMetadataAttributes {
    id?: bigint
    user_id?: bigint
    device_type?: string
    device_name?: string
    device_id?: string
    device_token?: string
    os_version?: string
    screen_resolution_width?: number
    screen_resolution_height?: number
    os_language?: string
    total_device_memory?: string
    has_notch?: boolean
    unique_id?: string
}

export default class UserMetadata extends Model<UserMetadataAttributes> implements UserMetadataAttributes {
    public readonly id!: bigint
    public user_id?: bigint
    public device_type?: string
    public device_name?: string
    public device_id?: string
    public device_token?: string
    public os_version?: string
    public screen_resolution_width?: number
    public screen_resolution_height?: number
    public os_language?: string
    public total_device_memory?: string
    public has_notch?: boolean
    public unique_id?: string

    static initialize(sequelize: Sequelize) {
        UserMetadata.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                },
                device_type: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                device_name: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                device_id: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                device_token: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                os_version: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                screen_resolution_width: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                screen_resolution_height: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                os_language: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                total_device_memory: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                has_notch: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                },
                unique_id: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
            },
            {
                sequelize,
                modelName: "UserMetadata",
                tableName: "user_metadatas",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }
} 