import { DataTypes, Model } from "sequelize"

class Notification extends Model {
    static init(sequelize) {
        super.init(
            {
                sender_user_id: DataTypes.INTEGER(),
                receiver_user_id: DataTypes.INTEGER(),
                moment_id: DataTypes.INTEGER(),
                memory_id: DataTypes.INTEGER(),
                viewed: DataTypes.BOOLEAN(),
                type: DataTypes.STRING(),
            },
            {
                sequelize,
                modelName: "Notification",
                tableName: "notifications",
            }
        )
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: "sender_user_id",
            foreignKey: "receiver_user_id",
            as: "user",
        })
        this.hasOne(models.Moment, {
            foreignKey: "moment_id",
            as: "moment",
        })
        this.hasOne(models.Memory, {
            foreignKey: "memory_id",
            as: "memory",
        })
    }
}
export default Notification
