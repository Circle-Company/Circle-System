import { DataTypes, Model, Sequelize } from "sequelize"

interface ProfilePictureAttributes {
    id: number
    user_id: number
    fullhd_resolution?: string | null
    tiny_resolution?: string | null
}

export default class ProfilePicture
    extends Model<ProfilePictureAttributes>
    implements ProfilePictureAttributes
{
    public id!: number
    public user_id!: number
    public fullhd_resolution!: string | null
    public tiny_resolution!: string | null

    static initialize(sequelize: Sequelize) {
        ProfilePicture.init(
            {
                id: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    autoIncrement: true,
                    primaryKey: true,
                },
                user_id: {
                    type: DataTypes.INTEGER.UNSIGNED,
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
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }
}
