const { Model, DataTypes } = require('sequelize');

class MomentStatistic extends Model {
    static init(sequelize) {
        super.init({
            is_trend: DataTypes.BOOLEAN,
            total_likes_num: DataTypes.BIGINT,
            total_views_num: DataTypes.BIGINT,
            total_shares_num: DataTypes.INTEGER,
            total_reports_num: DataTypes.INTEGER,
            total_skips_num: DataTypes.INTEGER,
            total_comments_num: DataTypes.BIGINT,
            total_profile_clicks_num: DataTypes.INTEGER,
        }, {
            sequelize,
            modelName: 'MomentStatistic',
            tableName: 'moment_statistics'
        });
    }

    static associate(models) {
        this.belongsTo(models.Moment, { foreignKey: 'moment_id', as: 'moment' });
    }
}

module.exports = MomentStatistic