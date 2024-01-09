const { Model, DataTypes, Sequelize} = require('sequelize')

class Follow extends Model {
    static init(sequelize) {
        super.init({
            user_id: DataTypes.INTEGER(),
            followed_user_id: DataTypes.INTEGER(),
        }, {
            sequelize
        })
    }

    static associate(models){
        this.belongsTo(models.User, {
            foreignKey: 'user_id',
            foreignKey: 'follow_user_id',
            as: 'user'
        })
    }
}
module.exports = Follow