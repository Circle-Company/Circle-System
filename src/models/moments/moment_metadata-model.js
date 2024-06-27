const { Model, DataTypes } = require('sequelize');

class MomentMetadata extends Model {
    static init(sequelize) {
        super.init({
            duration: DataTypes.INTEGER,
            file_name: DataTypes.STRING,
            file_size: DataTypes.INTEGER,
            file_type: DataTypes.STRING,
            resolution_width: DataTypes.INTEGER,
            resolution_height: DataTypes.INTEGER,
        }, {
            sequelize,
            modelName: 'MomentMetadata',
            tableName: 'moment_metadatas'
        });
    }

    static associate(models) {
        this.belongsTo(models.Moment, { foreignKey: 'moment_id', as: 'moment' });
    }
}

module.exports = MomentMetadata;