import { Model, DataTypes} from 'sequelize'

class Statistic extends Model {
    static init(sequelize) {
        super.init({
            total_followers_num: DataTypes.NUMBER(),
            total_likes_num: DataTypes.NUMBER(),
            total_views_num: DataTypes.NUMBER(),
            total_profile_views_num: DataTypes.NUMBER(),
            total_moments_num: DataTypes.NUMBER(),
            total_memories_num: DataTypes.NUMBER(),
        }, {
            sequelize,
            tableName: 'statistics'
        })
    }

    static associate(models){
        this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
    }
}
export default Statistic