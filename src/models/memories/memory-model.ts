import { Association, DataTypes, Model, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"
import Moment from "../moments/moment-model" // Certifique-se de que o modelo Moment está corretamente exportado
import User from "../user/user-model" // Certifique-se de que o modelo User está corretamente exportado
import MemoryMoment from "./memory_moments-model" // Certifique-se de que MemoryMoment está exportado corretamente

const snowflake = new SnowflakeID()

export default class Memory extends Model {
    declare id: bigint // `id` é obrigatório no retorno
    declare user_id: bigint
    declare title: string
    declare created_at: Date
    declare updated_at: Date

    // Associações estáticas
    declare static associations: {
        user: Association<Memory, User>
        memoryMoments: Association<Memory, MemoryMoment>
        moments: Association<Memory, Moment>
    }

    static initialize(sequelize: Sequelize): void {
        Memory.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => snowflake.generate(),
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                title: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: new Date(),
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: new Date(),
                },
            },
            {
                sequelize,
                timestamps: true,
                modelName: "Memory",
                tableName: "memories",
            }
        )
    }

    static associate(models: {
        User: typeof User
        Moment: typeof Moment
        MemoryMoment: typeof MemoryMoment
    }): void {
        Memory.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
        Memory.hasMany(models.MemoryMoment, { foreignKey: "memory_id", as: "memoryMoments" })
        Memory.belongsToMany(models.Moment, {
            through: models.MemoryMoment,
            foreignKey: "memory_id",
            as: "moments",
        })
    }
}
