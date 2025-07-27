import { DataTypes, Model, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

interface UserClusterRankAttributes {
    id: bigint
    userId: string
    clusterId: string
    score: number
    similarity: number
    interactionScore: number // Pontuação baseada nas interações do usuário com posts deste cluster
    matchScore: number // Quão bem o usuário corresponde ao padrão do cluster
    isActive: boolean
    lastInteractionDate: Date
    createdAt: Date
    updatedAt: Date
}

interface UserClusterRankCreationAttributes
    extends Omit<UserClusterRankAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

class UserClusterRank
    extends Model<UserClusterRankAttributes, UserClusterRankCreationAttributes>
    implements UserClusterRankAttributes
{
    public id!: bigint
    public userId!: string
    public clusterId!: string
    public score!: number
    public similarity!: number
    public interactionScore!: number
    public matchScore!: number
    public isActive!: boolean
    public lastInteractionDate!: Date

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        UserClusterRank.init(
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
                interactionScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "interaction_score",
                },
                matchScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "match_score",
                },
                isActive: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                    field: "is_active",
                },
                lastInteractionDate: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: "last_interaction_date",
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
                tableName: "swipe_user_cluster_ranks",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ["user_id", "cluster_id"],
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
        if (models.Cluster) {
            UserClusterRank.belongsTo(models.Cluster, {
                foreignKey: "cluster_id",
                as: "user_cluster_rank_cluster",
            })
        }

        if (models.User) {
            UserClusterRank.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user_cluster_rank_user",
            })
        }
    }
}

export default UserClusterRank
