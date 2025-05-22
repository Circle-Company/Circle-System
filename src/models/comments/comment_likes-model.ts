import { DataTypes, Model, Sequelize } from "sequelize"

interface CommentLikeAttributes {
    id?: bigint
    user_id: bigint
    comment_id: bigint
}

export default class CommentLike extends Model<CommentLikeAttributes> implements CommentLikeAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public comment_id!: bigint

    static initialize(sequelize: Sequelize) {
        CommentLike.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                comment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "CommentLike",
                tableName: "moment_comments_likes",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
        })

        this.belongsTo(models.MomentComment, {
            foreignKey: "comment_id",
            as: "comment",
        })
    }
} 