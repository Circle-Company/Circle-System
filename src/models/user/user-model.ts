import { DataTypes, Model, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"
const snowflake = new SnowflakeID()

interface UserAttributes {
    id: number
    username: string
    name?: string | null
    encrypted_password: string
    old_encrypted_password?: string | null
    description?: string | null
    access_level: number
    verifyed: boolean
    deleted: boolean
    blocked: boolean
    muted: boolean
    terms_and_conditions_agreed_version?: string | null
    terms_and_conditions_agreed_at?: Date | null
    last_active_at?: Date | null
    last_login_at?: Date | null
    last_failed_login_at?: Date | null
    last_password_updated_at?: Date | null
    send_notification_emails: boolean
}

export default class User extends Model<UserAttributes> implements UserAttributes {
    public id!: number
    public username!: string
    public name!: string | null
    public encrypted_password!: string
    public old_encrypted_password!: string | null
    public description!: string | null
    public access_level!: number
    public verifyed!: boolean
    public deleted!: boolean
    public blocked!: boolean
    public muted!: boolean
    public terms_and_conditions_agreed_version!: string | null
    public terms_and_conditions_agreed_at!: Date | null
    public last_active_at!: Date | null
    public last_login_at!: Date | null
    public last_failed_login_at!: Date | null
    public last_password_updated_at!: Date | null
    public send_notification_emails!: boolean

    static initialize(sequelize: Sequelize) {
        User.init(
            {
                id: {
                    type: DataTypes.NUMBER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                username: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                },
                name: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                encrypted_password: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                },
                old_encrypted_password: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                },
                description: {
                    type: DataTypes.STRING(300),
                    allowNull: true,
                },
                access_level: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                verifyed: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                },
                deleted: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                },
                blocked: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                },
                muted: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                },
                terms_and_conditions_agreed_version: {
                    type: DataTypes.STRING(10),
                    allowNull: true,
                },
                terms_and_conditions_agreed_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                last_active_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                last_login_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                last_failed_login_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                last_password_updated_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                send_notification_emails: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "User",
                tableName: "users",
            }
        )

        const createFullTextIndex = async () => {
            const [result] = await sequelize.query(
                `SHOW INDEX FROM users WHERE Key_name = 'fulltext_index_username';`
            )

            if ((result as any[]).length === 0) {
                await sequelize.query(
                    `ALTER TABLE users ADD FULLTEXT INDEX fulltext_index_username (username);`
                )
            }
        }
        createFullTextIndex()
    }

    static associate(models: any) {
        this.hasOne(models.ProfilePicture, {
            foreignKey: "user_id",
            as: "profile_pictures",
        })
        this.hasOne(models.Statistic, { foreignKey: "user_id", as: "statistics" })
        this.hasOne(models.UserMetadata, {
            foreignKey: "user_id",
            as: "user_metadatas",
        })
        this.hasOne(models.Contact, { foreignKey: "user_id", as: "contacts" })
        this.hasOne(models.Coordinate, {
            foreignKey: "user_id",
            as: "coordinates",
        })
        this.hasOne(models.Preference, {
            foreignKey: "user_id",
            as: "preferences",
        })
        this.hasMany(models.Block, {
            foreignKey: "user_id",
            as: "blocks",
        })
        this.hasOne(models.Socket, { foreignKey: "user_id", as: "sockets" })
        this.hasOne(models.NotificationToken, {
            foreignKey: "user_id",
            as: "notification_tokens",
        })
        this.belongsToMany(models.User, {
            foreignKey: "user_id",
            as: "following",
            through: "Follow",
        })
        this.belongsToMany(models.User, {
            foreignKey: "followed_user_id",
            as: "followers",
            through: "Follow",
        })
        this.hasMany(models.Report, { foreignKey: "user_id", as: "reports" })
        this.hasMany(models.Memory, { foreignKey: "user_id", as: "memories" })
        this.hasMany(models.Relation, {
            foreignKey: "user_id",
            as: "relations",
            onDelete: "CASCADE",
            hooks: true,
        })
        this.hasMany(models.Notification, {
            foreignKey: "sender_user_id",
            as: "notifications_sent",
        })
        this.hasMany(models.Notification, {
            foreignKey: "receiver_user_id",
            as: "notifications_received",
        })
        this.hasMany(models.Like, { foreignKey: "user_id", as: "who_liked" })
        this.hasMany(models.View, { foreignKey: "user_id", as: "who_viewed" })
        this.hasMany(models.Share, { foreignKey: "user_id", as: "who_shared" })
        this.hasMany(models.Skip, { foreignKey: "user_id", as: "who_skipped" })
        this.hasMany(models.ProfileClick, {
            foreignKey: "user_id",
            as: "who_profile_clicked",
        })
    }
}