const { DataTypes, Model } = require("sequelize")

class ProfileClick extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: DataTypes.INTEGER(),
                liked_moment_id: DataTypes.INTEGER(),
            },
            {
                sequelize,
                modelName: "ProfileClick",
                tableName: "profile_clicks",
            }
        )
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "who_profile_clicked",
        })

        this.belongsTo(models.Moment, {
            foreignKey: "profile_clicked_moment_id",
            as: "profile_clicked_moment",
        })
    }
}
module.exports = ProfileClick
