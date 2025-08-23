import { DataTypes, Model, Sequelize } from "sequelize"

interface BlockAttributes {
    id?: bigint
    user_id: bigint
    blocked_user_id: bigint
}

export default class Block extends Model<BlockAttributes> implements BlockAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public blocked_user_id!: bigint

    static initialize(sequelize: Sequelize) {
        Block.init(
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
                blocked_user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "Block",
                tableName: "blocks",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
        })
        this.belongsTo(models.User, {
            foreignKey: "blocked_user_id",
            as: "blocked_user",
        })
    }
} 