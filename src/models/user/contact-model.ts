import { DataTypes, Model, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

interface ContactAttributes {
    id?: bigint
    user_id?: bigint
    phone_number?: string
    country_prefix?: string
    state_prefix?: string
    phone_last_updated_at?: Date | string
    email?: string
    email_last_updated_at?: Date | string
}

export default class Contact extends Model<ContactAttributes> implements ContactAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public phone_number?: string
    public country_prefix?: string
    public state_prefix?: string
    public phone_last_updated_at?: Date | string
    public email?: string
    public email_last_updated_at?: Date | string

    static initialize(sequelize: Sequelize) {
        Contact.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => snowflake.generate(),
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                },
                phone_number: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                country_prefix: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                state_prefix: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                phone_last_updated_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: null,
                },
                email: {
                    type: DataTypes.STRING,
                    defaultValue: null,
                    allowNull: true,
                },
                email_last_updated_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
            },
            {
                sequelize,
                modelName: "Contact",
                tableName: "contacts",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }
}
