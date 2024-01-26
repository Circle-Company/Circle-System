const { Model, DataTypes} = require('sequelize')

class User extends Model {
    static init(sequelize) {
        super.init({
            username: DataTypes.STRING(30),
            name: DataTypes.STRING(50),
            encrypted_password: DataTypes.STRING(100),
            old_encrypted_password: DataTypes.STRING(100),
            description: DataTypes.STRING(300),
            access_level: DataTypes.INTEGER(1),
            verifyed: DataTypes.BOOLEAN(),
            deleted: DataTypes.BOOLEAN(),
            blocked: DataTypes.BOOLEAN(),
            muted: DataTypes.BOOLEAN(),
            terms_and_conditions_agreed_version: DataTypes.STRING(10),
            terms_and_conditions_agreed_at: DataTypes.DATE(),
            last_active_at: DataTypes.DATE(),
            last_login_at: DataTypes.DATE(),
            last_failed_login_at: DataTypes.DATE(),
            last_password_updated_at: DataTypes.DATE(),
            send_notification_emails: DataTypes.BOOLEAN()
        }, { sequelize })
        const createFullTextIndex = async () => {
            const [result] = await sequelize.query(`
                SHOW INDEX FROM users WHERE Key_name = 'fulltext_index_username';
            `);
        
            if (result.length === 0) {
                await sequelize.query(`
                    ALTER TABLE users ADD FULLTEXT INDEX fulltext_index_username (username);
                `);
            }
        }
        createFullTextIndex()
    }

    static associate(models){
        this.hasOne(models.ProfilePicture, { foreignKey: 'user_id', as: 'profile_pictures' })
        this.hasOne(models.Statistic, { foreignKey: 'user_id', as: 'statistics' })
        this.hasOne(models.Contact, { foreignKey: 'user_id', as: 'contacts' })
        this.hasOne(models.Coordinate, { foreignKey: 'user_id', as: 'coordinates' })
        this.hasMany(models.Block, { foreignKey: 'user_id', foreignKey: 'blocked_user_id', as: 'blocks'})
        this.hasOne(models.Socket, { foreignKey: 'user_id', as: 'sockets' })
        this.belongsToMany(models.User, { foreignKey: 'user_id', as: 'following', through: 'Follow' })
        this.belongsToMany(models.User, { foreignKey: 'followed_user_id' , as: 'followers', through: 'Follow'})
        this.hasMany(models.Report, { foreignKey: 'user_id', as: 'reports'})
            // Associação para representar os relacionamentos diretos do usuário
        this.hasMany(models.Relation, {
            foreignKey: 'user_id',
            foreignKey: 'related_user_id',
            as: 'relations',
            onDelete: 'CASCADE',
            hooks: true,
        });
    }
}
module.exports = User