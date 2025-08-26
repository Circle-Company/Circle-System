import { Request, Response } from 'express'
import crypto from 'crypto'
import SubscriptionManager from '../../services/subscription/SubscriptionManager'
import UserSubscription from '../../models/subscription/user-subscription-model'
import SubscriptionValidationLog from '../../models/subscription/subscription-validation-log-model'
import { UserFactory } from '../../classes/user/UserFactory'

interface GooglePlayNotification {
    version: string
    packageName: string
    eventTimeMillis: string
    subscriptionNotification?: {
        version: string
        notificationType: number
        purchaseToken: string
        subscriptionId: string
    }
    testNotification?: {
        version: string
    }
}

/**
 * Processa webhook do Google Play
 */
export async function handle_google_play_webhook(req: Request, res: Response): Promise<void> {
    try {
        // Verificar assinatura da requisição
        if (!verifySignature(req)) {
            console.warn('Webhook com assinatura inválida:', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date()
            })
            
            res.status(401).json({
                success: false,
                error: 'Assinatura inválida'
            })
            return
        }

        const data = req.body

        // Decodificar mensagem base64
        if (!data.message || !data.message.data) {
            console.warn('Webhook sem dados válidos:', data)
            res.status(400).json({
                success: false,
                error: 'Dados inválidos'
            })
            return
        }

        const notificationData = JSON.parse(
            Buffer.from(data.message.data, 'base64').toString()
        ) as GooglePlayNotification

        console.log('Google Play Notification recebida:', {
            packageName: notificationData.packageName,
            eventTime: notificationData.eventTimeMillis,
            type: notificationData.subscriptionNotification?.notificationType
        })

        // Processar notificação
        await processNotification(notificationData)

        // Responder com sucesso
        res.status(200).json({
            success: true,
            message: 'Notificação processada com sucesso'
        })

    } catch (error: any) {
        console.error('Erro ao processar webhook Google Play:', error)
        
        // Ainda responder com sucesso para evitar reenvios
        res.status(200).json({
            success: false,
            error: 'Erro interno, mas notificação foi recebida'
        })
    }
}

/**
 * Verifica assinatura da requisição do Google Play
 */
function verifySignature(req: Request): boolean {
    try {
        const publicKeyBase64 = process.env.GOOGLE_PLAY_PUBLIC_KEY
        if (!publicKeyBase64) {
            console.warn('GOOGLE_PLAY_PUBLIC_KEY não configurada')
            return false // Em desenvolvimento, aceitar sem verificação
        }

        const signature = req.get('X-Goog-Signature')
        if (!signature) {
            return false
        }

        const publicKey = Buffer.from(publicKeyBase64, 'base64').toString()
        const verifier = crypto.createVerify('sha1')
        verifier.update(JSON.stringify(req.body))
        
        return verifier.verify(publicKey, signature, 'base64')

    } catch (error) {
        console.error('Erro ao verificar assinatura:', error)
        return false
    }
}

/**
 * Processa uma notificação específica
 */
async function processNotification(notification: GooglePlayNotification): Promise<void> {
    // Verificar se é notificação de teste
    if (notification.testNotification) {
        console.log('Notificação de teste recebida')
        return
    }

    const subNotification = notification.subscriptionNotification
    if (!subNotification) {
        console.warn('Notificação sem dados de assinatura')
        return
    }

    const { purchaseToken, subscriptionId, notificationType } = subNotification

    // Buscar assinatura no banco
    const subscription = await UserSubscription.findOne({
        where: { purchase_token: purchaseToken }
    })

    if (!subscription) {
        console.warn('Assinatura não encontrada para token:', purchaseToken)
        await SubscriptionValidationLog.logError({
            userId: BigInt(0),
            purchaseToken: purchaseToken,
            validationType: 'webhook',
            errorMessage: 'Assinatura não encontrada no banco de dados',
            errorCode: 'SUBSCRIPTION_NOT_FOUND'
        })
        return
    }

    // Processar baseado no tipo de notificação
    await handleNotificationType(subscription, notificationType)
}

/**
 * Processa diferentes tipos de notificação
 */
async function handleNotificationType(subscription: UserSubscription, notificationType: number): Promise<void> {
    const startTime = Date.now()
    const subscriptionManager = new SubscriptionManager()

    try {
        switch (notificationType) {
            case 1: // SUBSCRIPTION_RECOVERED
                console.log('Assinatura recuperada:', subscription.id)
                await subscriptionManager.revalidateSubscription(subscription.id, 'manual')
                UserFactory.clearCache(subscription.user_id)
                break

            case 2: // SUBSCRIPTION_RENEWED
                console.log('Assinatura renovada:', subscription.id)
                await subscriptionManager.revalidateSubscription(subscription.id, 'manual')
                UserFactory.clearCache(subscription.user_id)
                break

            case 3: // SUBSCRIPTION_CANCELED
                console.log('Assinatura cancelada:', subscription.id)
                subscription.status = 'canceled'
                subscription.cancel_reason = 'user_canceled'
                await subscription.save()
                UserFactory.clearCache(subscription.user_id)
                break

            case 4: // SUBSCRIPTION_PURCHASED
                console.log('Nova assinatura comprada:', subscription.id)
                await subscriptionManager.revalidateSubscription(subscription.id, 'manual')
                break

            case 5: // SUBSCRIPTION_ON_HOLD
                console.log('Assinatura em hold:', subscription.id)
                subscription.status = 'paused'
                await subscription.save()
                UserFactory.clearCache(subscription.user_id)
                break

            case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
                console.log('Assinatura em período de graça:', subscription.id)
                subscription.status = 'active'
                await subscription.save()
                break

            case 7: // SUBSCRIPTION_RESTARTED
                console.log('Assinatura reiniciada:', subscription.id)
                subscription.status = 'active'
                subscription.cancel_reason = 'none'
                await subscription.save()
                UserFactory.clearCache(subscription.user_id)
                break

            case 8: // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
                console.log('Mudança de preço confirmada:', subscription.id)
                await subscriptionManager.revalidateSubscription(subscription.id, 'manual')
                break

            case 9: // SUBSCRIPTION_DEFERRED
                console.log('Assinatura adiada:', subscription.id)
                await subscriptionManager.revalidateSubscription(subscription.id, 'manual')
                break

            case 10: // SUBSCRIPTION_PAUSED
                console.log('Assinatura pausada:', subscription.id)
                subscription.status = 'paused'
                await subscription.save()
                UserFactory.clearCache(subscription.user_id)
                break

            case 11: // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
                console.log('Cronograma de pausa alterado:', subscription.id)
                await subscriptionManager.revalidateSubscription(subscription.id, 'manual')
                break

            case 12: // SUBSCRIPTION_REVOKED
                console.log('Assinatura revogada:', subscription.id)
                subscription.status = 'canceled'
                subscription.cancel_reason = 'system_canceled'
                await subscription.save()
                UserFactory.clearCache(subscription.user_id)
                break

            case 13: // SUBSCRIPTION_EXPIRED
                console.log('Assinatura expirada:', subscription.id)
                subscription.status = 'expired'
                await subscription.save()
                UserFactory.clearCache(subscription.user_id)
                break

            default:
                console.warn('Tipo de notificação desconhecido:', notificationType)
                await SubscriptionValidationLog.logError({
                    userId: subscription.user_id,
                    subscriptionId: subscription.id,
                    purchaseToken: subscription.purchase_token,
                    validationType: 'webhook',
                    errorMessage: `Tipo de notificação desconhecido: ${notificationType}`,
                    errorCode: 'UNKNOWN_NOTIFICATION_TYPE'
                })
        }

        // Log de sucesso
        await SubscriptionValidationLog.logSuccess({
            userId: subscription.user_id,
            subscriptionId: subscription.id,
            purchaseToken: subscription.purchase_token,
            validationType: 'webhook',
            googleResponse: `Notification type ${notificationType} processed`,
            responseTimeMs: Date.now() - startTime
        })

    } catch (error: any) {
        console.error(`Erro ao processar notificação tipo ${notificationType}:`, error)
        
        await SubscriptionValidationLog.logError({
            userId: subscription.user_id,
            subscriptionId: subscription.id,
            purchaseToken: subscription.purchase_token,
            validationType: 'webhook',
            errorMessage: error.message,
            errorCode: 'WEBHOOK_PROCESSING_ERROR',
            responseTimeMs: Date.now() - startTime
        })
    }
}
