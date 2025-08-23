import { Association, DataTypes, Model, Sequelize } from "sequelize"
import Moment from "../moments/moment-model"
import Memory from "./memory-model"
class MemoryMoment extends Model {
    declare readonly id: number
    declare memory_id: bigint
    declare moment_id: bigint

    declare static associations: {
        memory: Association<MemoryMoment, Memory>
        moment: Association<MemoryMoment, Moment>
    }

    static initialize(sequelize: Sequelize): void {
        MemoryMoment.init(
            {
                id: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    autoIncrement: true,
                    primaryKey: true,
                },
                memory_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    references: {
                        model: Memory,
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    references: {
                        model: Moment,
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
                },
            },
            {
                sequelize,
                modelName: "MemoryMoment",
                tableName: "memory_moments",
                timestamps: true,
                createdAt: "created_at",
                updatedAt: "updated_at",
            }
        )
    }

    static associate(models: { Memory: typeof Memory; Moment: typeof Moment }): void {
        MemoryMoment.belongsTo(models.Memory, { foreignKey: "memory_id", as: "memory" })
        MemoryMoment.belongsTo(models.Moment, { foreignKey: "moment_id", as: "moment" })
    }
}

export default MemoryMoment
