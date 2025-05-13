import { Model, DataTypes, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

interface UserInteractionSummaryAttributes {
    userId: bigint
    totalInteractions: number
    lastInteractionDate: Date | null
    interactionCounts: Record<string, number>
    createdAt: Date
    updatedAt: Date
}

interface UserInteractionSummaryCreationAttributes
    extends Omit<UserInteractionSummaryAttributes, "createdAt" | "updatedAt"> {}

class UserInteractionSummary extends Model<
    UserInteractionSummaryAttributes,
    UserInteractionSummaryCreationAttributes
> implements UserInteractionSummaryAttributes {
    public userId!: bigint
    public totalInteractions!: number
    public lastInteractionDate!: Date | null
    public interactionCounts!: Record<string, number>
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        UserInteractionSummary.init(
            {
                userId: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    field: "user_id",
                },
                totalInteractions: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "total_interactions",
                },
                lastInteractionDate: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "last_interaction_date",
                },
                interactionCounts: {
                    type: DataTypes.JSON,
                    allowNull: false,
                    defaultValue: {},
                    field: "interaction_counts",
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
                tableName: "swipe_user_interaction_summary",
                timestamps: true,
                underscored: true,
            }
        )
    }

    // Método estático para definir associações
    public static associate(models: any): void {
        // Associação com User
        if (models.User) {
            UserInteractionSummary.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "interaction_summary_user",
                targetKey: "id"
            })
        }
    }
}

export default UserInteractionSummary 