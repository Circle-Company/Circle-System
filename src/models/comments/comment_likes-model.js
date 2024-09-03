const { Model, DataTypes } = require("sequelize")

class CommentLike extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: DataTypes.INTEGER(),
                comment_id: DataTypes.INTEGER(),
            },
            {
                sequelize,
                modelName: "CommentLike",
                tableName: "moment_comments_likes",
            }
        )
    }

    static associate(models) {
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

module.exports = CommentLike
