const { Model, DataTypes} = require('sequelize')

class User extends Model {
    static init(sequelize) {
        super.init({
            username: DataTypes.STRING(30),
            name: DataTypes.STRING(50),
            encrypted_password: DataTypes.STRING(100),
            description: DataTypes.STRING(300),
            access_level: DataTypes.STRING(10),
            verifyed: DataTypes.BOOLEAN(),
            deleted: DataTypes.BOOLEAN(),
            blocked: DataTypes.BOOLEAN(),
            muted: DataTypes.BOOLEAN(),
            terms_and_conditions_agreed_version: DataTypes.STRING(10),
            terms_and_conditions_agreed_at: DataTypes.DATE(),
            last_active_at: DataTypes.DATE(),
            send_notification_emails: DataTypes.BOOLEAN()
        }, { sequelize })
    }

    static associate(models){
        this.hasOne(models.ProfilePicture, { foreignKey: 'user_id', as: 'profile_pictures' })
        this.hasOne(models.Statistic, { foreignKey: 'user_id', as: 'statistics' })
    }
}
module.exports = User