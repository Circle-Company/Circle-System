const { DataTypes, Model } = require("sequelize")

class View extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: DataTypes.INTEGER(),
                viewed_moment_id: DataTypes.INTEGER(),
            },
            {
                sequelize,
                modelName: "View",
                tableName: "views",
            }
        )
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "who_viewed",
        })

        this.belongsTo(models.Moment, {
            foreignKey: "viewed_moment_id",
            as: "viewed_moment",
        })
    }
}
module.exports = View
