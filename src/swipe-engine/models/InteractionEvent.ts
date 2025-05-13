import { DataTypes, Model, Sequelize } from "sequelize"
import { EntityType, InteractionType, UserInteraction } from "../core/types"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

interface InteractionEventAttributes {
    id: bigint
    userId: string
    entityId: string
    entityType: EntityType
    type: InteractionType
    timestamp: Date
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface InteractionEventCreationAttributes
    extends Omit<InteractionEventAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

class InteractionEvent
    extends Model<InteractionEventAttributes, InteractionEventCreationAttributes>
    implements InteractionEventAttributes
{
    public id!: bigint
    public userId!: string
    public entityId!: string
    public entityType!: EntityType
    public type!: InteractionType
    public timestamp!: Date
    public metadata!: Record<string, any>

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Converte para o tipo UserInteraction do core
    public toUserInteraction(): UserInteraction {
        return {
            id: this.id.toString(),
            userId: BigInt(this.userId),
            entityId: BigInt(this.entityId),
            entityType: this.entityType,
            type: this.type,
            timestamp: this.timestamp,
            metadata: this.metadata,
        }
    }

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        InteractionEvent.init(
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
                entityId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "entity_id",
                },
                entityType: {
                    type: DataTypes.ENUM("user", "post"),
                    allowNull: false,
                    field: "entity_type",
                },
                type: {
                    type: DataTypes.ENUM(
                        "short_view",
                        "long_view",
                        "like",
                        "dislike",
                        "share",
                        "comment",
                        "like_comment",
                        "show_less_often",
                        "report"
                    ),
                    allowNull: false,
                },
                timestamp: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
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
                tableName: "swipe_interaction_events",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["user_id"],
                    },
                    {
                        fields: ["entity_id", "entity_type"],
                    },
                    {
                        fields: ["timestamp"],
                    },
                ],
            }
        )
    }

    // Método para definir associações
    public static associate(models: any): void {
        // Associação com User
        if (models.User) {
            InteractionEvent.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "interaction_event_user",
                targetKey: "id"
            })
        }

        // Associação com Moment (quando entityType é 'post')
        if (models.Moment) {
            InteractionEvent.belongsTo(models.Moment, {
                foreignKey: "entity_id",
                as: "interaction_event_post",
                targetKey: "id",
                constraints: false,
                scope: {
                    entityType: "post"
                }
            })
        }
    }
}

export default InteractionEvent
