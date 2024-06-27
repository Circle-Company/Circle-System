const { Model, DataTypes } = require('sequelize');

class CommentStatistic extends Model {
    static init(sequelize) {
        super.init({
            total_likes_num: DataTypes.INTEGER,
            total_replies_num: DataTypes.INTEGER,
            total_reports_num: DataTypes.INTEGER,
        }, {
            sequelize,
            modelName: 'CommentStatistic',
            tableName: 'moment_comments_statistics' // Adicione o nome do modelo se desejar
        });
    }

    static associate(models) {
        this.belongsTo(models.MomentComment, { foreignKey: 'comment_id', as: 'comment' });
    }
}

module.exports = CommentStatistic;
