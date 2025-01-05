import { DataTypes, Model, Sequelize } from "sequelize"

interface FollowAttributes {
    id?: number
    user_id: bigint
    followed_user_id: bigint
}

export default class Follow extends Model<FollowAttributes> implements FollowAttributes {
    public readonly id!: number
    public user_id!: bigint
    public followed_user_id!: bigint

    static initialize(sequelize: Sequelize) {
        Follow.init(
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
                followed_user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "Follow",
                tableName: "follows",
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "following",
        })
        this.belongsTo(models.User, {
            foreignKey: "followed_user_id",
            as: "followers",
        })
    }
}
