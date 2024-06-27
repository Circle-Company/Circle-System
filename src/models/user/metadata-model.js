const { Model, DataTypes } = require('sequelize');

class UserMetadata extends Model {
    static init(sequelize) {
        super.init({
            device_type: DataTypes.STRING,
            device_name: DataTypes.STRING,
            device_id: DataTypes.STRING,
            device_token: DataTypes.STRING,
            os_version: DataTypes.STRING,
            screen_resolution_width: DataTypes.INTEGER,
            screen_resolution_height: DataTypes.INTEGER,
            os_language: DataTypes.STRING,
            total_device_memory: DataTypes.STRING,
            has_notch: DataTypes.BOOLEAN,
            unique_id: DataTypes.STRING,
        }, {
            sequelize,
            modelName: 'UserMetadata',
            tableName: 'user_metadatas' // Adicione o nome do modelo se desejar
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
}

module.exports = UserMetadata;
