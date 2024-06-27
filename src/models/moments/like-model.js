import { Model, DataTypes} from 'sequelize'

class Like extends Model {
    static init(sequelize) {
        super.init({
            user_id: DataTypes.INTEGER(),
            liked_moment_id: DataTypes.INTEGER(),
        },      {
            sequelize,
            modelName: 'Like',
            tableName: 'likes',
          })
    }

    static associate(models){
        this.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'who_liked',
        });

        this.belongsTo(models.Moment, {
            foreignKey: 'liked_moment_id',
            as: 'liked_moment',
        });
    }
}
export default Like