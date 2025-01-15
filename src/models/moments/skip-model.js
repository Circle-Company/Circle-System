const { DataTypes, Model } = require("sequelize")

class Skip extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: DataTypes.INTEGER(),
                skipped_moment_id: DataTypes.INTEGER(),
            },
            {
                sequelize,
                modelName: "Skip",
                tableName: "skips",
            }
        )
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "who_skipped",
        })

        this.belongsTo(models.Moment, {
            foreignKey: "skipped_moment_id",
            as: "skipped_moment",
        })
    }
}
module.exports = Skip
