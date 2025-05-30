import { DataTypes, Model, Sequelize } from "sequelize"

import { PostEmbedding as PostEmbeddingType } from "../core/types/index"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

interface PostEmbeddingAttributes {
    id: bigint
    postId: string
    vector: string // JSON stringificado do vetor
    dimension: number
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface PostEmbeddingCreationAttributes
    extends Omit<PostEmbeddingAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

class PostEmbedding
    extends Model<PostEmbeddingAttributes, PostEmbeddingCreationAttributes>
    implements PostEmbeddingAttributes
{
    public id!: bigint
    public postId!: string
    public vector!: string
    public dimension!: number
    public metadata!: Record<string, any>

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Converte para o tipo PostEmbedding do core
    public toPostEmbeddingType(): any {
        const vectorData = JSON.parse(this.vector) as number[]
        return {
            postId: this.postId,
            vector: {
                dimension: this.dimension,
                values: vectorData,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt
            },
            metadata: this.metadata,
            createdAt: this.createdAt
        }
    }

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        PostEmbedding.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => snowflake.generate(),
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
        // Associação com Post/Moment
        if (models.Moment) {
            PostEmbedding.belongsTo(models.Moment, {
                foreignKey: "post_id",
                as: "post_embedding_post",
                targetKey: "id"
            })
        }
    }
}

export default PostEmbedding
