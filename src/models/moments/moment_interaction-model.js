const { Model, DataTypes } = require('sequelize');

class MomentInteraction extends Model {
    static init(sequelize) {
        super.init({
            user_id: DataTypes.INTEGER,
            moment_owner_id: DataTypes.INTEGER,
            moment_id: DataTypes.INTEGER,
            like: DataTypes.BOOLEAN,
            share: DataTypes.BOOLEAN,
            click_into_moment: DataTypes.BOOLEAN,
            watch_time: DataTypes.INTEGER,
            click_profile: DataTypes.BOOLEAN,
            comment: DataTypes.BOOLEAN,
            like_comment: DataTypes.BOOLEAN,
            pass_to_next: DataTypes.BOOLEAN,
            show_less_often: DataTypes.BOOLEAN,
            report: DataTypes.BOOLEAN,
            negative_interaction_rate: DataTypes.FLOAT,
            positive_interaction_rate: DataTypes.FLOAT,
        }, {
            sequelize,
            modelName: 'MomentInteraction',
            tableName: 'moment_interactions'
        });
    }

    static associate(models) {
        this.belongsTo(models.Moment, { foreignKey: 'moment_id', as: 'moment' });
    }
}

module.exports = MomentInteraction;