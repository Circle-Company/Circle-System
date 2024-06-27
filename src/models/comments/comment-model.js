const { Model, DataTypes } = require('sequelize');

class MomentComment extends Model {
    static init(sequelize) {
        super.init({
            content: DataTypes.STRING,
        }, {
            sequelize,
            modelName: 'MomentComment',
            tableName: 'moment_comments' // Adicione o nome do modelo se desejar
        });
    }
    
    static associate(models) {
        this.hasOne(models.CommentStatistic, { foreignKey: 'comment_id', as: 'comment_statistic' })
        this.belongsTo(models.Moment, { foreignKey: 'moment_id', as: 'moment' });
        this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        this.belongsTo(models.MomentComment, { foreignKey: 'parent_comment_id', as: 'parent_comment' });
        this.hasMany(models.MomentComment, { foreignKey: 'parent_comment_id', as: 'replies' });
    }
}

module.exports = MomentComment;
