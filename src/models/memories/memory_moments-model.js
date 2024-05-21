const { Model, DataTypes } = require('sequelize');

class MemoryMoment extends Model {
    static init(sequelize) {
        super.init({}, {
            sequelize,
            modelName: 'MemoryMoment', // Adicione o nome do modelo se desejar
            tableName: 'memory_moments', // Adicione o nome da tabela se desejar
        });
    }

    static associate(models) {
        this.belongsTo(models.Memory, { foreignKey: 'memory_id', as: 'memory' });
        this.belongsTo(models.Moment, { foreignKey: 'moment_id', as: 'moment' });
    }
}

module.exports = MemoryMoment;
