import { DataTypes, Model, Sequelize } from "sequelize"

interface CommentStatisticAttributes {
    id?: bigint
    comment_id?: bigint
    total_likes_num: number
    total_replies_num: number
    total_reports_num: number
}

export default class CommentStatistic extends Model<CommentStatisticAttributes> implements CommentStatisticAttributes {
    public readonly id!: bigint
    public comment_id?: bigint
    public total_likes_num!: number
    public total_replies_num!: number
    public total_reports_num!: number

    static initialize(sequelize: Sequelize) {
        CommentStatistic.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                comment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                },
                total_likes_num: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                total_replies_num: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                total_reports_num: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
            },
            {
                sequelize,
                modelName: "CommentStatistic",
                tableName: "moment_comments_statistics",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.MomentComment, { foreignKey: "comment_id", as: "comment" })
    }
} 