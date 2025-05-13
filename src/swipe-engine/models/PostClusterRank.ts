import { DataTypes, Model, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

interface PostClusterRankAttributes {
    id: bigint
    postId: string
    clusterId: string
    score: number
    similarity: number
    relevanceScore: number // Quão relevante este post é para o cluster
    engagementScore: number // Score de engajamento do post neste cluster
    isActive: boolean
    lastUpdated: Date
    createdAt: Date
    updatedAt: Date
}

interface PostClusterRankCreationAttributes
    extends Omit<PostClusterRankAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

class PostClusterRank
    extends Model<PostClusterRankAttributes, PostClusterRankCreationAttributes>
    implements PostClusterRankAttributes
{
    public id!: bigint
    public postId!: string
    public clusterId!: string
    public score!: number
    public similarity!: number
    public relevanceScore!: number
    public engagementScore!: number
    public isActive!: boolean
    public lastUpdated!: Date

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        PostClusterRank.init(
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
                clusterId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "cluster_id",
                },
                score: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                },
                similarity: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                },
                relevanceScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "relevance_score",
                },
                engagementScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "engagement_score",
                },
                isActive: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                    field: "is_active",
                },
                lastUpdated: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: "last_updated",
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
                tableName: "swipe_post_cluster_ranks",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ["post_id", "cluster_id"],
                    },
                    {
                        fields: ["score"],
                    },
                    {
                        fields: ["cluster_id", "is_active", "score"],
                    },
                ],
            }
        )
    }

    // Método para definir associações
    public static associate(models: any): void {
        // Associações podem ser adicionadas posteriormente
        if (models.PostCluster) {
            PostClusterRank.belongsTo(models.PostCluster, {
                foreignKey: "cluster_id",
                as: "post_cluster_rank_cluster",
            })
        }

        if (models.Moment) {
            PostClusterRank.belongsTo(models.Moment, {
                foreignKey: "post_id",
                as: "post_cluster_rank_post",
            })
        }
    }
}

export default PostClusterRank
