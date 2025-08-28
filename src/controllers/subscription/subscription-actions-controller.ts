import { Request, Response } from 'express'
import { ValidationError, InternalServerError, PaymentRequiredError, NotFoundError } from '../../errors'
import SubscriptionManager from '../../services/subscription/SubscriptionManager'
import UserSubscription from '../../models/subscription/user-subscription-model'
import SubscriptionValidationLog from '../../models/subscription/subscription-validation-log-model'

/**
 * Valida e ativa uma nova assinatura premium
 */
export async function activate_subscription(req: Request, res: Response): Promise<void> {
    try {
        const { purchaseToken, productId, orderId, packageName } = req.body
        const userId = (req as any).user?.id || req.user_id

        if (!userId) {
            throw new ValidationError({
                message: 'Usuário não autenticado',
                action: 'Faça login para ativar assinatura'
            })
        }

        if (!purchaseToken || !productId || !orderId) {
            throw new ValidationError({
                message: 'Dados de compra obrigatórios',
                action: 'Forneça purchaseToken, productId e orderId'
            })
        }

        const subscriptionManager = new SubscriptionManager()
        const result = await subscriptionManager.createSubscription({
            userId: BigInt(userId),
            purchaseToken,
            productId,
            orderId,
            packageName,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        })

        if (!result.success) {
            throw new PaymentRequiredError({
                message: result.error || 'Falha na validação da assinatura',
                action: 'Verifique os dados da compra e tente novamente'
            })
        }

        res.status(201).json({
            success: true,
            message: 'Assinatura ativada com sucesso',
            data: {
                subscription: result.subscription?.toDetailedJSON(),
                premium: true
            }
        })

    } catch (error: any) {
        console.error('Erro ao ativar assinatura:', error)
        
        if (error instanceof ValidationError || error instanceof PaymentRequiredError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                action: error.action
            })
        } else {
            throw new InternalServerError({
                message: 'Erro interno ao ativar assinatura',
                action: 'Tente novamente em alguns momentos'
            })
        }
    }
}

/**
 * Revalida uma assinatura específica
 */
export async function revalidate_subscription(req: Request, res: Response): Promise<void> {
    try {
        const subscriptionId = req.params.id
        const userId = (req as any).user?.id || req.user_id

        if (!userId) {
            throw new ValidationError({
                message: 'Usuário não autenticado'
            })
        }

        if (!subscriptionId) {
            throw new ValidationError({
                message: 'ID da assinatura obrigatório'
            })
        }

        // Verificar se a assinatura pertence ao usuário
        const subscription = await UserSubscription.findOne({
            where: {
                id: BigInt(subscriptionId),
                user_id: BigInt(userId)
            }
        })

        if (!subscription) {
            throw new NotFoundError({
                message: 'Assinatura não encontrada',
                action: 'Verifique o ID da assinatura'
            })
        }

        const subscriptionManager = new SubscriptionManager()
        const result = await subscriptionManager.revalidateSubscription(
            BigInt(subscriptionId),
            'manual'
        )

        if (!result.success) {
            throw new PaymentRequiredError({
                message: result.error || 'Falha na revalidação',
                action: 'Assinatura pode ter expirado'
            })
        }

        res.json({
            success: true,
            message: 'Assinatura revalidada com sucesso',
            data: {
                subscription: result.subscription?.toDetailedJSON()
            }
        })

    } catch (error: any) {
        console.error('Erro ao revalidar assinatura:', error)
        
        if (error instanceof ValidationError || 
            error instanceof NotFoundError || 
            error instanceof PaymentRequiredError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                action: error.action
            })
        } else {
            throw new InternalServerError({
                message: 'Erro interno ao revalidar assinatura'
            })
        }
    }
}

/**
 * Cancela uma assinatura
 */
export async function cancel_subscription(req: Request, res: Response): Promise<void> {
    try {
        const subscriptionId = req.params.id
        const userId = (req as any).user?.id || req.user_id
        const { reason } = req.body

        if (!userId) {
            throw new ValidationError({
                message: 'Usuário não autenticado'
            })
        }

        // Verificar se a assinatura pertence ao usuário
        const subscription = await UserSubscription.findOne({
            where: {
                id: BigInt(subscriptionId),
                user_id: BigInt(userId)
            }
        })

        if (!subscription) {
            throw new NotFoundError({
                message: 'Assinatura não encontrada'
            })
        }

        if (subscription.status === 'canceled') {
            res.json({
                success: true,
                message: 'Assinatura já estava cancelada',
                data: {
                    subscription: subscription.toDetailedJSON()
                }
            })
            return
        }

        const subscriptionManager = new SubscriptionManager()
        const result = await subscriptionManager.cancelSubscription(
            BigInt(subscriptionId),
            reason || 'user_canceled'
        )

        if (!result.success) {
            throw new InternalServerError({
                message: result.error || 'Falha ao cancelar assinatura'
            })
        }

        res.json({
            success: true,
            message: 'Assinatura cancelada com sucesso',
            data: {
                canceledAt: new Date(),
                reason: reason || 'user_canceled'
            }
        })

    } catch (error: any) {
        console.error('Erro ao cancelar assinatura:', error)
        
        if (error instanceof ValidationError || error instanceof NotFoundError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                action: error.action
            })
        } else {
            throw new InternalServerError({
                message: 'Erro interno ao cancelar assinatura'
            })
        }
    }
}
