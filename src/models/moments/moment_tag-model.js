const { Model, DataTypes } = require('sequelize');

class MomentTag extends Model {
    static init(sequelize) {
        super.init({
        }, {
            sequelize,
            modelName: 'MomentTag',
            tableName: 'moment_tags'
        });
    }

    static associate(models) {
        this.belongsTo(models.Moment, { foreignKey: 'moment_id', as: 'moment' });
        this.belongsTo(models.Tag, { foreignKey: 'tag_id', as: 'tag' });
    }
}

module.exports = MomentTag;
