const { Model, DataTypes } = require("sequelize");

class NotificationToken extends Model {
  static init(sequelize) {
    super.init(
      {
        user_id: DataTypes.INTEGER(),
        token: DataTypes.STRING(),
      },
      {
        sequelize,
        modelName: "NotificationToken",
        tableName: "notification_tokens",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  }
}
export default NotificationToken;
