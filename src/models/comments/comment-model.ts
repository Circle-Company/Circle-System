import { DataTypes, Model, Sequelize } from "sequelize"

interface MomentCommentAttributes {
    id?: bigint
    content: string
    user_id?: bigint
    moment_id?: bigint
    parent_comment_id?: bigint
}

export default class MomentComment extends Model<MomentCommentAttributes> implements MomentCommentAttributes {
    public readonly id!: bigint
    public content!: string
    public user_id?: bigint
    public moment_id?: bigint
    public parent_comment_id?: bigint

    static initialize(sequelize: Sequelize) {
        MomentComment.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                content: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                },
                moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                },
                parent_comment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                },
            },
            {
                sequelize,
                modelName: "MomentComment",
                tableName: "moment_comments",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.hasOne(models.CommentStatistic, { foreignKey: "comment_id", as: "comment_statistic" })
        this.belongsTo(models.Moment, { foreignKey: "moment_id", as: "moment" })
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
        this.belongsTo(models.MomentComment, {
            foreignKey: "parent_comment_id",
            as: "parent_comment",
        })
        this.hasMany(models.MomentComment, { foreignKey: "parent_comment_id", as: "replies" })
        this.hasMany(models.CommentLike, { foreignKey: "comment_id" })
    }
} 