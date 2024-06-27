const { Model, DataTypes } = require('sequelize');

class MomentMidia extends Model {
    static init(sequelize) {
        super.init({
            content_type: DataTypes.STRING,
            nhd_resolution: DataTypes.STRING,
            fullhd_resolution: DataTypes.STRING,
        }, {
            sequelize,
            modelName: 'MomentMidia',
            tableName: 'moment_midias' // Adicione o nome do modelo se desejar
        });
    }

    static associate(models) {
        this.belongsTo(models.Moment, { foreignKey: 'moment_id', as: 'moment' });
    }
}

module.exports = MomentMidia;