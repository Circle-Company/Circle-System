import { DataTypes, Model, Sequelize } from "sequelize"

interface ShareAttributes {
    id?: bigint
    user_id: bigint
    shared_moment_id: bigint
}

export default class Share extends Model<ShareAttributes> implements ShareAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public shared_moment_id!: bigint

    static initialize(sequelize: Sequelize) {
        Share.init(
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
                shared_moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "Share",
                tableName: "shares",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "who_shared",
        })

        this.belongsTo(models.Moment, {
            foreignKey: "shared_moment_id",
            as: "shared_moment",
        })
    }
} 