import { DataTypes, Model, Sequelize } from "sequelize"

interface ViewAttributes {
    id?: bigint
    user_id: bigint
    viewed_moment_id: bigint
}

export default class View extends Model<ViewAttributes> implements ViewAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public viewed_moment_id!: bigint

    static initialize(sequelize: Sequelize) {
        View.init(
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
                viewed_moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "View",
                tableName: "views",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "who_viewed",
        })

        this.belongsTo(models.Moment, {
            foreignKey: "viewed_moment_id",
            as: "viewed_moment",
        })
    }
} 