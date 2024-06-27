import { Model, DataTypes} from 'sequelize'

class ProfilePicture extends Model {
    static init(sequelize) {
        super.init({
            fullhd_resolution: DataTypes.STRING(),
            tiny_resolution: DataTypes.STRING()
        }, {
            sequelize,
            tableName: 'profile_pictures'
        })
    }

    static associate(models){
        this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
    }
}
export default ProfilePicture