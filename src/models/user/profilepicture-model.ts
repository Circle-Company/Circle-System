import { DataTypes, Model, Sequelize } from "sequelize"

interface ProfilePictureAttributes {
    id?: number
    user_id: bigint
    fullhd_resolution?: string | null
    tiny_resolution?: string | null
}

export default class ProfilePicture
    extends Model<ProfilePictureAttributes>
    implements ProfilePictureAttributes
{
    public readonly id!: number
    public user_id!: bigint
    public fullhd_resolution!: string | null
    public tiny_resolution!: string | null

    static initialize(sequelize: Sequelize) {
        ProfilePicture.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                fullhd_resolution: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                tiny_resolution: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
            },
            {
                sequelize,
                tableName: "profile_pictures",
                modelName: "ProfilePicture",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }
}
