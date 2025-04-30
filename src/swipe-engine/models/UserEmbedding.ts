import { DataTypes, Model, Sequelize } from "sequelize"
import { UserEmbedding as UserEmbeddingType } from "../core/types"

interface UserEmbeddingAttributes {
    id: string
    userId: string
    vector: string // JSON stringificado do EmbeddingVector
    dimension: number
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface UserEmbeddingCreationAttributes
    extends Omit<UserEmbeddingAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

class UserEmbedding
    extends Model<UserEmbeddingAttributes, UserEmbeddingCreationAttributes>
    implements UserEmbeddingAttributes
{
    public id!: string
    public userId!: string
    public vector!: string
    public dimension!: number
    public metadata!: Record<string, any>

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Converte para o tipo UserEmbedding do core
    public toUserEmbeddingType(): UserEmbeddingType {
        const vectorData = JSON.parse(this.vector) as number[]
        return {
            userId: this.userId,
            vector: {
                dimension: this.dimension,
                values: vectorData,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
            },
            metadata: this.metadata,
        }
    }

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        UserEmbedding.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                userId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "user_id",
                },
                vector: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    get() {
                        const rawValue = this.getDataValue("vector")
                        return rawValue ? JSON.parse(rawValue) : []
                    },
                    set(values: number[]) {
                        this.setDataValue("vector", JSON.stringify(values))
                    },
                },
                dimension: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 128,
                },
                metadata: {
                    type: DataTypes.JSONB,
                    defaultValue: {},
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: "created_at",
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: "updated_at",
                },
            },
            {
                sequelize,
                tableName: "swipe_user_embeddings",
                timestamps: true,
                underscored: true,
            }
        )
    }

    // Método para definir associações
    public static associate(models: any): void {
        // Associação com User poderia ser adicionada aqui
    }
}

export default UserEmbedding
