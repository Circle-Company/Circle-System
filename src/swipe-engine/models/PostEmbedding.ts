import { DataTypes, Model, Sequelize } from "sequelize"
import { PostEmbedding as PostEmbeddingType } from "../core/types"

interface PostEmbeddingAttributes {
    id: string
    postId: string
    vector: string // JSON stringificado do vetor
    dimension: number
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface PostEmbeddingCreationAttributes
    extends Omit<PostEmbeddingAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

class PostEmbedding
    extends Model<PostEmbeddingAttributes, PostEmbeddingCreationAttributes>
    implements PostEmbeddingAttributes
{
    public id!: string
    public postId!: string
    public vector!: string
    public dimension!: number
    public metadata!: Record<string, any>

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Converte para o tipo PostEmbedding do core
    public toPostEmbeddingType(): PostEmbeddingType {
        const vectorData = JSON.parse(this.vector) as number[]
        return {
            postId: this.postId,
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
        PostEmbedding.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                postId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "post_id",
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
                tableName: "swipe_post_embeddings",
                timestamps: true,
                underscored: true,
            }
        )
    }

    // Método para definir associações
    public static associate(models: any): void {
        // Associação com Post/Moment poderia ser adicionada aqui
    }
}

export default PostEmbedding
