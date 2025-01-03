import {
    Association,
    BelongsToManyGetAssociationsMixin,
    DataTypes,
    HasManyGetAssociationsMixin,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from "sequelize"
import SnowflakeID from "snowflake-id"
import Moment from "../moments/moment-model" // Certifique-se de que o modelo Moment está corretamente exportado
import User from "../user/user-model" // Certifique-se de que o modelo User está corretamente exportado
import MemoryMoment from "./memory_moments-model" // Certifique-se de que MemoryMoment está exportado corretamente
const snowflake = new SnowflakeID()

export default class Memory extends Model<
    InferAttributes<Memory>,
    InferCreationAttributes<Memory>
> {
    declare id: bigint
    declare user_id: bigint
    declare title: string

    // Mixins para métodos de associação
    declare getUser: BelongsToManyGetAssociationsMixin<User>
    declare getMoments: BelongsToManyGetAssociationsMixin<Moment>
    declare getMemoryMoments: HasManyGetAssociationsMixin<MemoryMoment>

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
                    type: DataTypes.NUMBER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    references: {
                        model: "users",
                        key: "id",
                    },
                },
                title: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
            },
            {
                sequelize,
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
