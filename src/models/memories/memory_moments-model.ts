import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from "sequelize"
import Moment from "../moments/moment-model"
import Memory from "./memory-model" // Adjust the path to your Moment model
class MemoryMoment extends Model<
    InferAttributes<MemoryMoment>,
    InferCreationAttributes<MemoryMoment>
> {
    declare id: CreationOptional<number> // Optional auto-increment primary key
    declare memory_id: bigint
    declare moment_id: bigint

    static initialize(sequelize: Sequelize): void {
        MemoryMoment.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                memory_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    references: {
                        model: "memories",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    references: {
                        model: "moments",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
            },
            {
                sequelize,
                modelName: "MemoryMoment",
                tableName: "memory_moments",
                timestamps: false, // Disable timestamps if not needed
            }
        )
    }

    static associate(models: { Memory: typeof Memory; Moment: typeof Moment }): void {
        this.belongsTo(models.Memory, { foreignKey: "memory_id", as: "memory" })
        this.belongsTo(models.Moment, { foreignKey: "moment_id", as: "moment" })
    }
}

export default MemoryMoment
