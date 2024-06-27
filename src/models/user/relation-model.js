import { Model, DataTypes} from 'sequelize'

class Relation extends Model {
  static init(sequelize) {
    super.init({
        weight: DataTypes.FLOAT,
      }, {
        sequelize,
        tableName: 'relations'
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {foreignKey: 'related_user_id', foreignKey: 'user_id', as: 'user' })
  }
}
export default Relation;