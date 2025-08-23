import { DataTypes, Model, Sequelize } from "sequelize"

import SnowflakeID from "snowflake-id"
import { UserEmbedding as UserEmbeddingType } from "../core/types"

const snowflake = new SnowflakeID()

interface UserEmbeddingAttributes {
    id: bigint
    userId: string
    vector: string // JSON stringificado do EmbeddingVector
    dimension: number
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface UserEmbeddingCreationAttributes
    extends Omit<UserEmbeddingAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

class UserEmbedding
    extends Model<UserEmbeddingAttributes, UserEmbeddingCreationAttributes>
    implements UserEmbeddingAttributes
{
    public id!: bigint
    public userId!: string
    public vector!: string
    public dimension!: number
    public metadata!: Record<string, any>

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Converte para o tipo UserEmbedding do core
    public toUserEmbeddingType(): UserEmbeddingType {
        try {
            // Parsear o vetor como um objeto com valores e dimensão
            const vectorObj = JSON.parse(this.vector);
            
            // Verificar se é o formato antigo (array simples) ou novo (objeto)
            let values: number[];
            if (Array.isArray(vectorObj)) {
                values = vectorObj;
            } else if (vectorObj && vectorObj.values) {
                values = vectorObj.values;
            } else {
                values = [];
            }
            
            return {
                userId: this.userId,
                vector: {
                    dimension: this.dimension,
                    values: values,
                    createdAt: this.createdAt,
                    updatedAt: this.updatedAt,
                },
                metadata: this.metadata,
            }
        } catch (error) {
            console.error(`Erro ao converter embedding: ${error}`);
            // Fallback para vetor vazio
            return {
                userId: this.userId,
                vector: {
                    dimension: this.dimension,
                    values: new Array(this.dimension).fill(0),
                    createdAt: this.createdAt,
                    updatedAt: this.updatedAt,
                },
                metadata: {
                    ...this.metadata,
                    error: `Falha ao deserializar: ${error}`
                },
            }
        }
    }

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        UserEmbedding.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => snowflake.generate(),
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
                        try {
                            if (!rawValue) return { values: [], dimension: 0 }
                            return JSON.parse(rawValue)
                        } catch (error) {
                            console.error(`Erro ao deserializar vetor: ${error}`)
                            return { values: [], dimension: 0 }
                        }
                    },
                    set(value: string | object) {
                        try {
                            // Se já for uma string, usar diretamente
                            if (typeof value === 'string') {
                                this.setDataValue("vector", value)
                            } 
                            // Se for um objeto ou array, serializar
                            else {
                                this.setDataValue("vector", JSON.stringify(value))
                            }
                        } catch (error) {
                            console.error(`Erro ao serializar vetor: ${error}`)
                            this.setDataValue("vector", JSON.stringify({ values: [], dimension: 0 }))
                        }
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
        // Associação com User
        if (models.User) {
            UserEmbedding.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "embedding_user",
                targetKey: "id"
            })
        }
    }
}

export default UserEmbedding
