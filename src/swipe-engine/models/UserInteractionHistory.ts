import { Model, DataTypes, Sequelize } from "sequelize"
import { InteractionType } from "../core/types"

interface UserInteractionHistoryAttributes {
    id: bigint
    userId: bigint
    entityId: bigint
    interactionType: InteractionType
    interactionDate: Date
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface UserInteractionHistoryCreationAttributes
    extends Omit<UserInteractionHistoryAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

class UserInteractionHistory extends Model<
    UserInteractionHistoryAttributes,
    UserInteractionHistoryCreationAttributes
> implements UserInteractionHistoryAttributes {
    public id!: bigint
    public userId!: bigint
    public entityId!: bigint
    public interactionType!: InteractionType
    public interactionDate!: Date
    public metadata!: Record<string, any>
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        UserInteractionHistory.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                userId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "user_id",
                },
                entityId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "entity_id",
                },
                interactionType: {
                    type: DataTypes.ENUM(
                        "short_view",
                        "long_view",
                        "like",
                        "dislike",
                        "share",
                        "comment",
                        "like_comment",
                        "show_less_often",
                        "report",
                        "save",
                        "click"
                    ),
                    allowNull: false,
                    field: "interaction_type",
                },
                interactionDate: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: "interaction_date",
                },
                metadata: {
                    type: DataTypes.JSON,
                    allowNull: false,
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
                tableName: "swipe_user_interaction_history",
                timestamps: true,
                underscored: true,
            }
        )
    }

    // Método estático para definir associações
    public static associate(models: any): void {
        // Associação com User
        if (models.User) {
            UserInteractionHistory.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "interaction_history_user",
                targetKey: "id"
            })
        }

        // Associação com Moment (quando entityType é 'post')
        if (models.Moment) {
            UserInteractionHistory.belongsTo(models.Moment, {
                foreignKey: "entity_id",
                as: "interaction_history_post",
                targetKey: "id",
                constraints: false,
                scope: {
                    entityType: "post"
                }
            })
        }
    }
}

export default UserInteractionHistory 