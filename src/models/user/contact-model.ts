import { DataTypes, Model, Sequelize } from "sequelize"

interface ContactAttributes {
    id?: bigint
    user_id?: bigint
    phone_number: number
    country_prefix: number
    state_prefix: number
    phone_last_updated_at?: Date | string
    email: string
    email_last_updated_at?: Date | string
}

export default class Contact extends Model<ContactAttributes> implements ContactAttributes {
    public readonly id!: bigint
    public user_id?: bigint
    public phone_number!: number
    public country_prefix!: number
    public state_prefix!: number
    public phone_last_updated_at?: Date | string
    public email!: string
    public email_last_updated_at?: Date | string

    static initialize(sequelize: Sequelize) {
        Contact.init(
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
                phone_number: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                country_prefix: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                state_prefix: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                phone_last_updated_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                email: {
                    type: DataTypes.STRING,
                    allowNull: false,
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