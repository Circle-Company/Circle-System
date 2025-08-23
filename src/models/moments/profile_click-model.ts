import { DataTypes, Model, Sequelize } from "sequelize"

interface ProfileClickAttributes {
    id?: bigint
    user_id: bigint
    profile_clicked_moment_id: bigint
}

export default class ProfileClick extends Model<ProfileClickAttributes> implements ProfileClickAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public profile_clicked_moment_id!: bigint

    static initialize(sequelize: Sequelize) {
        ProfileClick.init(
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
                profile_clicked_moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "ProfileClick",
                tableName: "profile_clicks",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "who_profile_clicked",
        })

        this.belongsTo(models.Moment, {
            foreignKey: "profile_clicked_moment_id",
            as: "profile_clicked_moment",
        })
    }
} 