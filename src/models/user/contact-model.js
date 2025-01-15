const { DataTypes, Model } = require("sequelize")

class Contact extends Model {
    static init(sequelize) {
        super.init(
            {
                phone_number: DataTypes.INTEGER(9),
                country_prefix: DataTypes.INTEGER(3),
                state_prefix: DataTypes.INTEGER(3),
                phone_last_updated_at: DataTypes.DATE(),
                email: DataTypes.STRING(),
                email_last_updated_at: DataTypes.DATE(),
            },
            {
                sequelize,
                tableName: "contacts",
            }
        )
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }
}
module.exports = Contact
