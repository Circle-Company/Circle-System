import { DataTypes, Model, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()
interface UserAttributes {
    id?: bigint
    username: string
    name?: string | null
    encrypted_password: string
    old_encrypted_password?: string | null
    description?: string | null
    access_level?: number
    verifyed?: boolean
    deleted?: boolean
    blocked?: boolean
    muted?: boolean
    terms_and_conditions_agreed_version?: string | null
    terms_and_conditions_agreed_at?: Date | string | null
    last_active_at?: Date | string | null
    last_login_at?: Date | string | null
    last_failed_login_at?: Date | string | null
    last_password_updated_at?: Date | string | null
    send_notification_emails?: boolean
}

export default class User extends Model<UserAttributes> implements UserAttributes {
    public readonly id!: bigint
    public username!: string
    public name?: string | null
    public encrypted_password!: string
    public old_encrypted_password?: string | null
    public description?: string | null
    public access_level?: number
    public verifyed?: boolean
    public deleted?: boolean
    public blocked?: boolean
    public muted?: boolean
    public terms_and_conditions_agreed_version!: string | null
    public terms_and_conditions_agreed_at!: Date | string | null
    public last_active_at!: Date | string | null
    public last_login_at!: Date | string | null
    public last_failed_login_at!: Date | string | null
    public last_password_updated_at!: Date | string | null
    public send_notification_emails?: boolean
    static initialize(sequelize: Sequelize) {
        User.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => snowflake.generate(),
                },
                username: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                },
                name: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                    defaultValue: null,
                },
                encrypted_password: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                },
                old_encrypted_password: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                    defaultValue: null,
                },
                description: {
                    type: DataTypes.STRING(300),
                    allowNull: true,
                    defaultValue: null,
                },
                access_level: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                verifyed: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                deleted: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                blocked: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                muted: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                terms_and_conditions_agreed_version: {
                    type: DataTypes.STRING(10),
                    allowNull: true,
                    defaultValue: "1.0.0",
                },
                terms_and_conditions_agreed_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: new Date(),
                },
                last_active_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: new Date(),
                },
                last_login_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: new Date(),
                },
                last_failed_login_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                last_password_updated_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: new Date(),
                },
                send_notification_emails: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                },
            },
            {
                sequelize,
                modelName: "User",
                tableName: "users",
                timestamps: true,
            }
        )

        // Removendo a criação automática do índice FULLTEXT
        // O índice será criado via migration
    }

    static async ensureFullTextIndex(sequelize: Sequelize) {
        try {
            // Verifica se o índice já existe
            const [result] = await sequelize.query(
                `SHOW INDEX FROM users WHERE Key_name = 'fulltext_index_username';`
            )

            if ((result as any[]).length === 0) {
                // Se não existir, tenta criar com retry em caso de deadlock
                let retries = 3
                while (retries > 0) {
                    try {
                        await sequelize.query(
                            `CREATE FULLTEXT INDEX fulltext_index_username ON users (username);`
                        )
                        console.log("[User] Índice FULLTEXT criado com sucesso")
                        break
                    } catch (error: any) {
                        if (error.original?.code === 'ER_LOCK_DEADLOCK' && retries > 1) {
                            console.log("[User] Deadlock detectado, tentando novamente...")
                            retries--
                            await new Promise(resolve => setTimeout(resolve, 1000)) // Espera 1 segundo
                            continue
                        }
                        throw error
                    }
                }
            }
        } catch (error) {
            console.error("[User] Erro ao criar índice FULLTEXT:", error)
            // Não propaga o erro para não impedir a inicialização do modelo
        }
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

        if (models.UserEmbedding) {
            this.hasOne(models.UserEmbedding, {
                foreignKey: "user_id",
                as: "user_embedding"
            })
        }

        if (models.UserInteractionHistory) {
            this.hasMany(models.UserInteractionHistory, {
                foreignKey: "user_id",
                as: "user_interaction_history"
            })
        }

        if (models.UserInteractionSummary) {
            this.hasOne(models.UserInteractionSummary, {
                foreignKey: "user_id",
                as: "user_interaction_summary"
            })
        }

        if (models.UserClusterRank) {
            this.hasMany(models.UserClusterRank, {
                foreignKey: "user_id",
                as: "user_cluster_ranks"
            })
        }

        if (models.InteractionEvent) {
            this.hasMany(models.InteractionEvent, {
                foreignKey: "user_id",
                as: "interaction_events"
            })
        }
    }
}
