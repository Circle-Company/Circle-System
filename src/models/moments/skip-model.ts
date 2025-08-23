import { DataTypes, Model, Sequelize } from "sequelize"

interface SkipAttributes {
    id?: bigint
    user_id: bigint
    skipped_moment_id: bigint
}

export default class Skip extends Model<SkipAttributes> implements SkipAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public skipped_moment_id!: bigint

    static initialize(sequelize: Sequelize) {
        Skip.init(
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
                skipped_moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "Skip",
                tableName: "skips",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "who_skipped",
        })

        this.belongsTo(models.Moment, {
            foreignKey: "skipped_moment_id",
            as: "skipped_moment",
        })
    }
} 