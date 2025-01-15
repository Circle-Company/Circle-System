const { DataTypes, Model } = require("sequelize")

class Report extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: DataTypes.INTEGER(),
                reported_content_id: DataTypes.INTEGER(),
                reported_content_type: DataTypes.STRING(),
                report_type: DataTypes.STRING(),
            },
            {
                sequelize,
                tableName: "reports",
            }
        )
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }
}
module.exports = Report
