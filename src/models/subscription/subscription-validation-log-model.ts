import { DataTypes, Model, Sequelize } from "sequelize"

interface SubscriptionValidationLogAttributes {
    id?: bigint
    user_id: bigint
    subscription_id?: bigint | null
    purchase_token: string
    validation_type: 'purchase' | 'renewal' | 'webhook' | 'manual' | 'scheduled'
    validation_result: 'success' | 'failure' | 'error'
    google_response?: string | null
    error_message?: string | null
    error_code?: string | null
    response_time_ms?: number | null
    ip_address?: string | null
    user_agent?: string | null
    created_at?: Date
}

export default class SubscriptionValidationLog extends Model<SubscriptionValidationLogAttributes> implements SubscriptionValidationLogAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public subscription_id!: bigint | null
    public purchase_token!: string
    public validation_type!: 'purchase' | 'renewal' | 'webhook' | 'manual' | 'scheduled'
    public validation_result!: 'success' | 'failure' | 'error'
    public google_response!: string | null
    public error_message!: string | null
    public error_code!: string | null
    public response_time_ms!: number | null
    public ip_address!: string | null
    public user_agent!: string | null
    public readonly created_at!: Date

    /**
     * Verifica se a validação foi bem-sucedida
     */
    public isSuccess(): boolean {
        return this.validation_result === 'success'
    }

    /**
     * Retorna dados resumidos do log
     */
    public getSummary() {
        return {
            id: this.id,
            type: this.validation_type,
            result: this.validation_result,
            responseTime: this.response_time_ms,
            hasError: !!this.error_message,
            createdAt: this.created_at
        }
    }

    /**
     * Cria log de validação bem-sucedida
     */
    static async logSuccess(data: {
        userId: bigint
        subscriptionId?: bigint
        purchaseToken: string
        validationType: 'purchase' | 'renewal' | 'webhook' | 'manual' | 'scheduled'
        googleResponse: string
        responseTimeMs?: number
        ipAddress?: string
        userAgent?: string
    }): Promise<SubscriptionValidationLog> {
        return await this.create({
            user_id: data.userId,
            subscription_id: data.subscriptionId || null,
            purchase_token: data.purchaseToken,
            validation_type: data.validationType,
            validation_result: 'success',
            google_response: data.googleResponse,
            error_message: null,
            error_code: null,
            response_time_ms: data.responseTimeMs || null,
            ip_address: data.ipAddress || null,
            user_agent: data.userAgent || null
        })
    }

    /**
     * Cria log de validação com falha
     */
    static async logFailure(data: {
        userId: bigint
        subscriptionId?: bigint
        purchaseToken: string
        validationType: 'purchase' | 'renewal' | 'webhook' | 'manual' | 'scheduled'
        errorMessage: string
        errorCode?: string
        googleResponse?: string
        responseTimeMs?: number
        ipAddress?: string
        userAgent?: string
    }): Promise<SubscriptionValidationLog> {
        return await this.create({
            user_id: data.userId,
            subscription_id: data.subscriptionId || null,
            purchase_token: data.purchaseToken,
            validation_type: data.validationType,
            validation_result: 'failure',
            google_response: data.googleResponse || null,
            error_message: data.errorMessage,
            error_code: data.errorCode || null,
            response_time_ms: data.responseTimeMs || null,
            ip_address: data.ipAddress || null,
            user_agent: data.userAgent || null
        })
    }

    /**
     * Cria log de erro de validação
     */
    static async logError(data: {
        userId: bigint
        subscriptionId?: bigint
        purchaseToken: string
        validationType: 'purchase' | 'renewal' | 'webhook' | 'manual' | 'scheduled'
        errorMessage: string
        errorCode?: string
        responseTimeMs?: number
        ipAddress?: string
        userAgent?: string
    }): Promise<SubscriptionValidationLog> {
        return await this.create({
            user_id: data.userId,
            subscription_id: data.subscriptionId || null,
            purchase_token: data.purchaseToken,
            validation_type: data.validationType,
            validation_result: 'error',
            google_response: null,
            error_message: data.errorMessage,
            error_code: data.errorCode || null,
            response_time_ms: data.responseTimeMs || null,
            ip_address: data.ipAddress || null,
            user_agent: data.userAgent || null
        })
    }

    static initModel(sequelize: Sequelize): typeof SubscriptionValidationLog {
        SubscriptionValidationLog.init(
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
                subscription_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                    references: {
                        model: 'user_subscriptions',
                        key: 'id'
                    }
                },
                purchase_token: {
                    type: DataTypes.TEXT,
                    allowNull: false
                },
                validation_type: {
                    type: DataTypes.ENUM('purchase', 'renewal', 'webhook', 'manual', 'scheduled'),
                    allowNull: false
                },
                validation_result: {
                    type: DataTypes.ENUM('success', 'failure', 'error'),
                    allowNull: false
                },
                google_response: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                error_message: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                error_code: {
                    type: DataTypes.STRING(50),
                    allowNull: true
                },
                response_time_ms: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
                ip_address: {
                    type: DataTypes.STRING(45),
                    allowNull: true
                },
                user_agent: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW
                }
            },
            {
                sequelize,
                tableName: "subscription_validation_logs",
                timestamps: false, // Apenas created_at
                indexes: [
                    {
                        fields: ['user_id']
                    },
                    {
                        fields: ['subscription_id']
                    },
                    {
                        fields: ['purchase_token']
                    },
                    {
                        fields: ['validation_type']
                    },
                    {
                        fields: ['validation_result']
                    },
                    {
                        fields: ['created_at']
                    },
                    {
                        fields: ['error_code']
                    },
                    {
                        fields: ['user_id', 'validation_result']
                    },
                    {
                        fields: ['created_at', 'validation_type']
                    }
                ]
            }
        )

        return SubscriptionValidationLog
    }

    static associate(models: any): void {
        // Associação com User
        SubscriptionValidationLog.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        })

        // Associação com UserSubscription
        SubscriptionValidationLog.belongsTo(models.UserSubscription, {
            foreignKey: 'subscription_id',
            as: 'subscription'
        })
    }
}
