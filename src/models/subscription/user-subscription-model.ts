import { DataTypes, Model, Sequelize } from "sequelize"

interface UserSubscriptionAttributes {
    id?: bigint
    user_id: bigint
    purchase_token: string
    product_id: string
    order_id: string
    status: 'active' | 'canceled' | 'expired' | 'paused' | 'pending'
    purchased_at: Date
    expires_at?: Date | null
    starts_at?: Date | null
    acknowledgment_state: 'yet_to_be_acknowledged' | 'acknowledged'
    auto_renewing: boolean
    price_amount_micros: number
    price_currency_code: string
    country_code: string
    payment_state: 'payment_pending' | 'payment_received' | 'free_trial' | 'pending_deferred'
    cancel_reason?: 'none' | 'user_canceled' | 'system_canceled' | 'replaced' | 'developer_canceled' | null
    original_json: string
    last_validated_at?: Date | null
    validation_attempts: number
    created_at?: Date
    updated_at?: Date
}

export default class UserSubscription extends Model<UserSubscriptionAttributes> implements UserSubscriptionAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public purchase_token!: string
    public product_id!: string
    public order_id!: string
    public status!: 'active' | 'canceled' | 'expired' | 'paused' | 'pending'
    public purchased_at!: Date
    public expires_at!: Date | null
    public starts_at!: Date | null
    public acknowledgment_state!: 'yet_to_be_acknowledged' | 'acknowledged'
    public auto_renewing!: boolean
    public price_amount_micros!: number
    public price_currency_code!: string
    public country_code!: string
    public payment_state!: 'payment_pending' | 'payment_received' | 'free_trial' | 'pending_deferred'
    public cancel_reason!: 'none' | 'user_canceled' | 'system_canceled' | 'replaced' | 'developer_canceled' | null
    public original_json!: string
    public last_validated_at!: Date | null
    public validation_attempts!: number
    public readonly created_at!: Date
    public readonly updated_at!: Date

    /**
     * Verifica se a assinatura está ativa
     */
    public isActive(): boolean {
        if (this.status !== 'active') return false
        if (!this.expires_at) return true // Assinatura sem expiração
        return this.expires_at > new Date()
    }

    /**
     * Verifica se a assinatura precisa ser renovada
     */
    public needsRenewal(): boolean {
        if (!this.expires_at) return false
        const gracePeriod = 3 * 24 * 60 * 60 * 1000 // 3 dias
        return (this.expires_at.getTime() - Date.now()) < gracePeriod
    }

    /**
     * Verifica se a assinatura foi reconhecida
     */
    public isAcknowledged(): boolean {
        return this.acknowledgment_state === 'acknowledged'
    }

    /**
     * Calcula dias restantes da assinatura
     */
    public getDaysRemaining(): number {
        if (!this.expires_at) return -1 // Ilimitado
        const diff = this.expires_at.getTime() - Date.now()
        return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
    }

    /**
     * Retorna preço formatado
     */
    public getFormattedPrice(): string {
        const price = this.price_amount_micros / 1000000
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: this.price_currency_code
        }).format(price)
    }

    /**
     * Converte para JSON com campos adicionais
     */
    public toDetailedJSON() {
        return {
            ...this.toJSON(),
            isActive: this.isActive(),
            needsRenewal: this.needsRenewal(),
            isAcknowledged: this.isAcknowledged(),
            daysRemaining: this.getDaysRemaining(),
            formattedPrice: this.getFormattedPrice()
        }
    }

    static initModel(sequelize: Sequelize): typeof UserSubscription {
        UserSubscription.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    references: {
                        model: 'users',
                        key: 'id'
                    }
                },
                purchase_token: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    unique: true
                },
                product_id: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                order_id: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    unique: true
                },
                status: {
                    type: DataTypes.ENUM('active', 'canceled', 'expired', 'paused', 'pending'),
                    allowNull: false,
                    defaultValue: 'pending'
                },
                purchased_at: {
                    type: DataTypes.DATE,
                    allowNull: false
                },
                expires_at: {
                    type: DataTypes.DATE,
                    allowNull: true
                },
                starts_at: {
                    type: DataTypes.DATE,
                    allowNull: true
                },
                acknowledgment_state: {
                    type: DataTypes.ENUM('yet_to_be_acknowledged', 'acknowledged'),
                    allowNull: false,
                    defaultValue: 'yet_to_be_acknowledged'
                },
                auto_renewing: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true
                },
                price_amount_micros: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },
                price_currency_code: {
                    type: DataTypes.STRING(3),
                    allowNull: false,
                    defaultValue: 'BRL'
                },
                country_code: {
                    type: DataTypes.STRING(2),
                    allowNull: false,
                    defaultValue: 'BR'
                },
                payment_state: {
                    type: DataTypes.ENUM('payment_pending', 'payment_received', 'free_trial', 'pending_deferred'),
                    allowNull: false,
                    defaultValue: 'payment_pending'
                },
                cancel_reason: {
                    type: DataTypes.ENUM('none', 'user_canceled', 'system_canceled', 'replaced', 'developer_canceled'),
                    allowNull: true,
                    defaultValue: 'none'
                },
                original_json: {
                    type: DataTypes.TEXT,
                    allowNull: false
                },
                last_validated_at: {
                    type: DataTypes.DATE,
                    allowNull: true
                },
                validation_attempts: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW
                }
            },
            {
                sequelize,
                tableName: "user_subscriptions",
                timestamps: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                indexes: [
                    {
                        fields: ['user_id']
                    },
                    {
                        fields: ['purchase_token'],
                        unique: true
                    },
                    {
                        fields: ['order_id'],
                        unique: true
                    },
                    {
                        fields: ['status']
                    },
                    {
                        fields: ['expires_at']
                    },
                    {
                        fields: ['product_id']
                    },
                    {
                        fields: ['created_at']
                    }
                ]
            }
        )

        return UserSubscription
    }

    static associate(models: any): void {
        // Associação com User
        UserSubscription.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        })

        // Associação com SubscriptionValidationLog
        UserSubscription.hasMany(models.SubscriptionValidationLog, {
            foreignKey: 'subscription_id',
            as: 'validation_logs'
        })
    }
}
