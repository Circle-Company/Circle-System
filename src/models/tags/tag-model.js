const { Model, DataTypes } = require('sequelize');

class Tag extends Model {
    static init(sequelize) {
        super.init({
            title: DataTypes.STRING,
        }, {
            sequelize,
            modelName: 'Tag',
            tableName: 'tags'
        });
    }

    static associate(models) {
        this.belongsToMany(models.MomentTag, { 
            through: 'MomentTag', 
            foreignKey: 'tag_id', 
            otherKey: 'moment_id',
            as: 'momentTags' 
        });
    }
}

module.exports = Tag;
