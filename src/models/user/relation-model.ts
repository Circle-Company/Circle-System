import { DataTypes, Model, Sequelize } from "sequelize"

interface RelationAttributes {
    id?: number
    weight: number
    user_id: bigint
    related_user_id: bigint
    created_at?: Date
    updated_at?: Date
}

class Relation extends Model<RelationAttributes> implements RelationAttributes {
    declare id?: number
    declare weight: number
    declare user_id: bigint
    declare related_user_id: bigint
    declare created_at?: Date
    declare updated_at?: Date

    static initialize(sequelize: Sequelize): void {
        Relation.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                weight: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                related_user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
                },
            },
            {
                sequelize,
                tableName: "relations",
                timestamps: true,
                createdAt: "created_at",
                updatedAt: "updated_at",
            }
        )
    }

    static associate(models: any): void {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
        })
        this.belongsTo(models.User, {
            foreignKey: "related_user_id",
            as: "related_user",
        })
    }
}

export default Relation
