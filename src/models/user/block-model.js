const { DataTypes, Model } = require("sequelize")

class Block extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: DataTypes.INTEGER(),
                blocked_user_id: DataTypes.INTEGER(),
            },
            {
                sequelize,
                tableName: "blocks",
            }
        )
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            foreignKey: "blocked_user_id",
            as: "user",
        })
    }
}
module.exports = Block
