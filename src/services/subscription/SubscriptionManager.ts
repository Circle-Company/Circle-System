import GooglePlayService, { GooglePlayReceipt, ValidationResult } from '../google-play/GooglePlayService'
import UserSubscription from '../../models/subscription/user-subscription-model'
import SubscriptionValidationLog from '../../models/subscription/subscription-validation-log-model'
import { UserFactory } from '../../classes/user/UserFactory'
import { Op } from 'sequelize'

export interface CreateSubscriptionData {
    userId: bigint
    purchaseToken: string
    productId: string
    orderId: string
    packageName?: string
    ipAddress?: string
    userAgent?: string
}

export interface SubscriptionStatus {
    hasActiveSubscription: boolean
    subscription?: UserSubscription
    daysRemaining?: number
    nextRenewal?: Date
    status: string
}

/**
 * Gerenciador central de assinaturas
 * Coordena validação, criação e manutenção de assinaturas premium
 */
export class SubscriptionManager {
    private googlePlayService: GooglePlayService

    constructor() {
        this.googlePlayService = GooglePlayService.getInstance()
    }

    /**
     * Valida e cria nova assinatura
     */
    async createSubscription(data: CreateSubscriptionData): Promise<{
        success: boolean
        subscription?: UserSubscription
        error?: string
    }> {
        const startTime = Date.now()

        try {
            // Verificar se já existe assinatura ativa para este usuário
            const existingActive = await this.getActiveSubscription(data.userId)
            if (existingActive) {
                await SubscriptionValidationLog.logFailure({
                    userId: data.userId,
                    purchaseToken: data.purchaseToken,
                    validationType: 'purchase',
                    errorMessage: 'Usuário já possui assinatura ativa',
                    errorCode: 'DUPLICATE_SUBSCRIPTION',
                    responseTimeMs: Date.now() - startTime,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                })

                return {
                    success: false,
                    error: 'Usuário já possui assinatura ativa'
                }
            }

            // Verificar se este token já foi usado
            const existingToken = await UserSubscription.findOne({
                where: { purchase_token: data.purchaseToken }
            })

            if (existingToken) {
                await SubscriptionValidationLog.logFailure({
                    userId: data.userId,
                    subscriptionId: existingToken.id,
                    purchaseToken: data.purchaseToken,
                    validationType: 'purchase',
                    errorMessage: 'Token de compra já foi utilizado',
                    errorCode: 'DUPLICATE_TOKEN',
                    responseTimeMs: Date.now() - startTime,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                })

                return {
                    success: false,
                    error: 'Token de compra já foi utilizado'
                }
            }

            // Validar com Google Play
            const receipt: GooglePlayReceipt = {
                purchaseToken: data.purchaseToken,
                productId: data.productId,
                orderId: data.orderId,
                packageName: data.packageName || process.env.GOOGLE_PLAY_PACKAGE_NAME || ''
            }

            const validation = await this.googlePlayService.validateSubscription(receipt)

            if (!validation.isValid) {
                await SubscriptionValidationLog.logFailure({
                    userId: data.userId,
                    purchaseToken: data.purchaseToken,
                    validationType: 'purchase',
                    errorMessage: validation.error || 'Validação falhou',
                    errorCode: 'VALIDATION_FAILED',
                    googleResponse: JSON.stringify(validation.subscription || {}),
                    responseTimeMs: Date.now() - startTime,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                })

                return {
                    success: false,
                    error: validation.error || 'Assinatura inválida'
                }
            }

            // Criar registro da assinatura
            const subscription = await UserSubscription.create({
                user_id: data.userId,
                purchase_token: data.purchaseToken,
                product_id: data.productId,
                order_id: data.orderId,
                status: validation.isActive ? 'active' : 'pending',
                purchased_at: new Date(),
                expires_at: validation.expiresAt || null,
                starts_at: validation.subscription?.startTimeMillis 
                    ? new Date(parseInt(validation.subscription.startTimeMillis))
                    : new Date(),
                acknowledgment_state: validation.subscription?.acknowledgementState === 1 
                    ? 'acknowledged' 
                    : 'yet_to_be_acknowledged',
                auto_renewing: validation.autoRenewing || false,
                price_amount_micros: parseInt(validation.subscription?.priceAmountMicros || '0'),
                price_currency_code: validation.subscription?.priceCurrencyCode || 'BRL',
                country_code: validation.subscription?.countryCode || 'BR',
                payment_state: GooglePlayService.parsePaymentState(
                    validation.subscription?.paymentState || 0
                ) as any,
                cancel_reason: GooglePlayService.parseCancelReason(
                    validation.subscription?.cancelReason
                ) as any,
                original_json: JSON.stringify(validation.subscription || {}),
                last_validated_at: new Date(),
                validation_attempts: 1
            })

            // Reconhecer assinatura se necessário
            if (validation.subscription?.acknowledgementState === 0) {
                await this.googlePlayService.acknowledgeSubscription(receipt, `user_${data.userId}`)
                subscription.acknowledgment_state = 'acknowledged'
                await subscription.save()
            }

            // Log de sucesso
            await SubscriptionValidationLog.logSuccess({
                userId: data.userId,
                subscriptionId: subscription.id,
                purchaseToken: data.purchaseToken,
                validationType: 'purchase',
                googleResponse: JSON.stringify(validation.subscription || {}),
                responseTimeMs: Date.now() - startTime,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            })

            // Invalidar cache do usuário
            UserFactory.clearCache(data.userId)

            return {
                success: true,
                subscription: subscription
            }

        } catch (error: any) {
            await SubscriptionValidationLog.logError({
                userId: data.userId,
                purchaseToken: data.purchaseToken,
                validationType: 'purchase',
                errorMessage: error.message,
                errorCode: 'SYSTEM_ERROR',
                responseTimeMs: Date.now() - startTime,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            })

            console.error('Erro ao criar assinatura:', error)
            return {
                success: false,
                error: 'Erro interno do servidor'
            }
        }
    }

    /**
     * Obtém assinatura ativa do usuário
     */
    async getActiveSubscription(userId: bigint): Promise<UserSubscription | null> {
        return await UserSubscription.findOne({
            where: {
                user_id: userId,
                status: 'active',
                [Op.or]: [
                    { expires_at: null }, // Assinatura sem expiração
                    { expires_at: { [Op.gt]: new Date() } } // Não expirada
                ]
            },
            order: [['created_at', 'DESC']]
        })
    }

    /**
     * Obtém status da assinatura do usuário
     */
    async getSubscriptionStatus(userId: bigint): Promise<SubscriptionStatus> {
        const subscription = await this.getActiveSubscription(userId)

        if (!subscription) {
            return {
                hasActiveSubscription: false,
                status: 'free'
            }
        }

        return {
            hasActiveSubscription: true,
            subscription: subscription,
            daysRemaining: subscription.getDaysRemaining(),
            nextRenewal: subscription.expires_at,
            status: subscription.status
        }
    }

    /**
     * Revalida uma assinatura existente
     */
    async revalidateSubscription(subscriptionId: bigint, validationType: 'renewal' | 'manual' | 'scheduled' = 'manual'): Promise<{
        success: boolean
        subscription?: UserSubscription
        error?: string
    }> {
        const startTime = Date.now()

        try {
            const subscription = await UserSubscription.findByPk(subscriptionId)
            if (!subscription) {
                return {
                    success: false,
                    error: 'Assinatura não encontrada'
                }
            }

            const receipt: GooglePlayReceipt = {
                purchaseToken: subscription.purchase_token,
                productId: subscription.product_id,
                orderId: subscription.order_id,
                packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || ''
            }

            const validation = await this.googlePlayService.validateSubscription(receipt)

            // Atualizar registro da assinatura
            subscription.last_validated_at = new Date()
            subscription.validation_attempts += 1

            if (validation.isValid) {
                subscription.status = validation.isActive ? 'active' : 'expired'
                subscription.expires_at = validation.expiresAt || null
                subscription.auto_renewing = validation.autoRenewing || false
                subscription.original_json = JSON.stringify(validation.subscription || {})

                await subscription.save()

                await SubscriptionValidationLog.logSuccess({
                    userId: subscription.user_id,
                    subscriptionId: subscription.id,
                    purchaseToken: subscription.purchase_token,
                    validationType: validationType,
                    googleResponse: JSON.stringify(validation.subscription || {}),
                    responseTimeMs: Date.now() - startTime
                })

                // Invalidar cache do usuário
                UserFactory.clearCache(subscription.user_id)

                return {
                    success: true,
                    subscription: subscription
                }
            } else {
                subscription.status = 'expired'
                await subscription.save()

                await SubscriptionValidationLog.logFailure({
                    userId: subscription.user_id,
                    subscriptionId: subscription.id,
                    purchaseToken: subscription.purchase_token,
                    validationType: validationType,
                    errorMessage: validation.error || 'Assinatura inválida',
                    errorCode: 'VALIDATION_FAILED',
                    googleResponse: JSON.stringify(validation.subscription || {}),
                    responseTimeMs: Date.now() - startTime
                })

                return {
                    success: false,
                    error: validation.error || 'Assinatura inválida'
                }
            }

        } catch (error: any) {
            await SubscriptionValidationLog.logError({
                userId: BigInt(0), // Será atualizado se subscription for encontrada
                subscriptionId: subscriptionId,
                purchaseToken: '',
                validationType: validationType,
                errorMessage: error.message,
                errorCode: 'SYSTEM_ERROR',
                responseTimeMs: Date.now() - startTime
            })

            console.error('Erro ao revalidar assinatura:', error)
            return {
                success: false,
                error: 'Erro interno do servidor'
            }
        }
    }

    /**
     * Cancela uma assinatura
     */
    async cancelSubscription(subscriptionId: bigint, reason: string = 'user_canceled'): Promise<{
        success: boolean
        error?: string
    }> {
        try {
            const subscription = await UserSubscription.findByPk(subscriptionId)
            if (!subscription) {
                return {
                    success: false,
                    error: 'Assinatura não encontrada'
                }
            }

            // Cancelar no Google Play (opcional, depende da política)
            const receipt: GooglePlayReceipt = {
                purchaseToken: subscription.purchase_token,
                productId: subscription.product_id,
                orderId: subscription.order_id,
                packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || ''
            }

            // Atualizar status local
            subscription.status = 'canceled'
            subscription.cancel_reason = reason as any
            await subscription.save()

            // Invalidar cache do usuário
            UserFactory.clearCache(subscription.user_id)

            await SubscriptionValidationLog.logSuccess({
                userId: subscription.user_id,
                subscriptionId: subscription.id,
                purchaseToken: subscription.purchase_token,
                validationType: 'manual',
                googleResponse: 'Subscription canceled locally'
            })

            return { success: true }

        } catch (error: any) {
            console.error('Erro ao cancelar assinatura:', error)
            return {
                success: false,
                error: 'Erro interno do servidor'
            }
        }
    }

    /**
     * Lista todas as assinaturas de um usuário
     */
    async getUserSubscriptions(userId: bigint): Promise<UserSubscription[]> {
        return await UserSubscription.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        })
    }

    /**
     * Job para revalidar assinaturas expiradas ou próximas do vencimento
     */
    async revalidateExpiringSubscriptions(): Promise<void> {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)

        const expiringSubscriptions = await UserSubscription.findAll({
            where: {
                status: 'active',
                expires_at: {
                    [Op.lt]: tomorrow
                }
            }
        })

        console.log(`Revalidando ${expiringSubscriptions.length} assinaturas expirando`)

        for (const subscription of expiringSubscriptions) {
            await this.revalidateSubscription(subscription.id, 'scheduled')
            // Esperar um pouco entre validações para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }
}

export default SubscriptionManager
