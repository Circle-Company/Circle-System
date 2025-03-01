const { Model, DataTypes } = require("sequelize")

class Preference extends Model {
    static init(sequelize) {
        super.init(
            {
                disable_autoplay: DataTypes.BOOLEAN,
                disable_haptics: DataTypes.BOOLEAN,
                disable_translation: DataTypes.BOOLEAN,
                translation_language: DataTypes.STRING,
                app_language: DataTypes.STRING,
                disable_like_moment_push_notification: DataTypes.BOOLEAN,
                disable_new_memory_push_notification: DataTypes.BOOLEAN,
                disable_add_to_memory_push_notification: DataTypes.BOOLEAN,
                disable_follow_user_push_notification: DataTypes.BOOLEAN,
                disable_view_user_push_notification: DataTypes.BOOLEAN,
                disable_news_push_notification: DataTypes.BOOLEAN,
                disable_sugestions_push_notification: DataTypes.BOOLEAN,
                disable_around_you_push_notification: DataTypes.BOOLEAN,
            },
            {
                sequelize,
                modelName: "Preference",
                tableName: "preferences",
            }
        )
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
        })
    }
}

module.exports = Preference
