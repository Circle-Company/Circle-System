const { Model, DataTypes } = require('sequelize');

class Memory extends Model {
    static init(sequelize) {
        super.init({
            user_id: DataTypes.INTEGER(),
            title: DataTypes.STRING(),
            // Adicione outros campos relevantes para as memories
        }, {
            sequelize,
            modelName: 'Memory',
            tableName: 'memories'
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        this.hasMany(models.MemoryMoment, { foreignKey: 'memory_id', as: 'memoryMoments' }); // Alterado para hasMany
        this.belongsToMany(models.Moment, { through: 'MemoryMoments', foreignKey: 'memory_id', as: 'moments' });
    }
}

module.exports = Memory;
