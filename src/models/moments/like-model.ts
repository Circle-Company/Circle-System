import { DataTypes, Model, Optional, Sequelize } from "sequelize"

interface LikeAttributes {
    id: number
    user_id: bigint
    liked_moment_id: bigint
}

interface LikeCreationAttributes extends Optional<LikeAttributes, "id"> {}

class Like extends Model<LikeAttributes, LikeCreationAttributes> implements LikeAttributes {
    public id!: number
    public user_id!: bigint
    public liked_moment_id!: bigint

    static initialize(sequelize: Sequelize): void {
        Like.init(
            {
                id: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    autoIncrement: true,
                    primaryKey: true,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    references: {
                        model: "users",
                        key: "id",
                    },
                },
                liked_moment_id: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    allowNull: false,
                    references: {
                        model: "moments",
                        key: "id",
                    },
                },
            },
            {
                sequelize,
                modelName: "Like",
                tableName: "likes",
                timestamps: true, // Caso queira usar createdAt e updatedAt
                underscored: true, // Caso prefira nomes de colunas no estilo snake_case
            }
        )
    }

    static associate(models: any): void {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "who_liked",
        })

        this.belongsTo(models.Moment, {
            foreignKey: "liked_moment_id",
            as: "liked_moment",
        })
    }
}

export default Like
