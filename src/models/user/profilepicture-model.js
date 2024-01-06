const { Model, DataTypes} = require('sequelize')

class ProfilePicture extends Model {
    static init(sequelize) {
        super.init({
            fullhd_resolution: DataTypes.STRING(),
            tiny_resolution: DataTypes.STRING()
        }, {
            sequelize
        })
    }

    static associate(models){
        this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
    }
}
module.exports = ProfilePicture