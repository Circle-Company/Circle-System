import { Request, Response } from 'express'
import { ValidationError, InternalServerError, NotFoundError } from '../../errors'
import SubscriptionManager from '../../services/subscription/SubscriptionManager'
import UserSubscription from '../../models/subscription/user-subscription-model'
import SubscriptionValidationLog from '../../models/subscription/subscription-validation-log-model'
import { UserFactory } from '../../classes/user/UserFactory'

/**
 * Obtém status da assinatura do usuário
 */
export async function get_subscription_status(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id || req.user_id

        if (!userId) {
            throw new ValidationError({
                message: 'Usuário não autenticado',
                action: 'Faça login para verificar assinatura'
            })
        }

        const subscriptionManager = new SubscriptionManager()
        const status = await subscriptionManager.getSubscriptionStatus(BigInt(userId))
        const user = await UserFactory.createUser(BigInt(userId))

        res.json({
            success: true,
            data: {
                hasActiveSubscription: status.hasActiveSubscription,
                subscription: status.subscription?.toDetailedJSON(),
                daysRemaining: status.daysRemaining,
                nextRenewal: status.nextRenewal,
                status: status.status,
                userType: user.getUserType(),
                features: await user.getAvailableFeatures()
            }
        })

    } catch (error: any) {
        console.error('Erro ao buscar status da assinatura:', error)
        throw new InternalServerError({
            message: 'Erro interno ao buscar status da assinatura',
            action: 'Tente novamente em alguns momentos'
        })
    }
}

/**
 * Lista histórico de assinaturas do usuário
 */
export async function get_subscription_history(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id || req.user_id

        if (!userId) {
            throw new ValidationError({
                message: 'Usuário não autenticado'
            })
        }

        const subscriptionManager = new SubscriptionManager()
        const subscriptions = await subscriptionManager.getUserSubscriptions(BigInt(userId))

        res.json({
            success: true,
            data: {
                subscriptions: subscriptions.map(sub => sub.toDetailedJSON()),
                total: subscriptions.length
            }
        })

    } catch (error: any) {
        console.error('Erro ao buscar histórico de assinaturas:', error)
        throw new InternalServerError({
            message: 'Erro interno ao buscar histórico',
            action: 'Tente novamente em alguns momentos'
        })
    }
}

/**
 * Obtém logs de validação de uma assinatura
 */
export async function get_validation_logs(req: Request, res: Response): Promise<void> {
    try {
        const subscriptionId = req.params.id
        const userId = (req as any).user?.id || req.user_id
        const { page = 1, limit = 20 } = req.query

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

        const offset = (Number(page) - 1) * Number(limit)

        const logs = await SubscriptionValidationLog.findAndCountAll({
            where: {
                subscription_id: BigInt(subscriptionId)
            },
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset: offset
        })

        res.json({
            success: true,
            data: {
                logs: logs.rows.map(log => log.getSummary()),
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: logs.count,
                    pages: Math.ceil(logs.count / Number(limit))
                }
            }
        })

    } catch (error: any) {
        console.error('Erro ao buscar logs de validação:', error)
        
        if (error instanceof ValidationError || error instanceof NotFoundError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            })
        } else {
            throw new InternalServerError({
                message: 'Erro interno ao buscar logs'
            })
        }
    }
}

/**
 * Verificar acesso a feature específica
 */
export async function check_feature_access(req: Request, res: Response): Promise<void> {
    try {
        const featureName = req.params.featureName
        const userId = (req as any).user?.id || req.user_id

        if (!userId) {
            res.status(401).json({
                success: false,
                hasAccess: false,
                error: 'Usuário não autenticado'
            })
            return
        }

        const user = await UserFactory.createUser(BigInt(userId))
        const hasAccess = await user.canAccessFeature(featureName)
        const remainingUsage = await user.getRemainingUsage(featureName)

        res.json({
            success: true,
            hasAccess: hasAccess,
            feature: featureName,
            userType: user.getUserType(),
            remainingUsage: remainingUsage,
            isPremium: user.getUserType() === 'premium'
        })

    } catch (error) {
        console.error('Erro ao verificar acesso à feature:', error)
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        })
    }
}

/**
 * Listar features disponíveis para o usuário
 */
export async function get_available_features(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id || req.user_id

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            })
            return
        }

        const user = await UserFactory.createUser(BigInt(userId))
        const availableFeatures = await user.getAvailableFeatures()

        res.json({
            success: true,
            data: {
                userType: user.getUserType(),
                availableFeatures: availableFeatures,
                isPremium: user.getUserType() === 'premium'
            }
        })

    } catch (error) {
        console.error('Erro ao buscar features disponíveis:', error)
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        })
    }
}

/**
 * Obtém estatísticas do sistema de assinaturas (admin only)
 */
export async function get_admin_stats(req: Request, res: Response): Promise<void> {
    try {
        // TODO: Adicionar verificação de admin

        const stats = await Promise.all([
            UserSubscription.count({ where: { status: 'active' } }),
            UserSubscription.count({ where: { status: 'canceled' } }),
            UserSubscription.count({ where: { status: 'expired' } }),
            SubscriptionValidationLog.count({ where: { validation_result: 'success' } }),
            SubscriptionValidationLog.count({ where: { validation_result: 'failure' } })
        ])

        res.json({
            success: true,
            data: {
                activeSubscriptions: stats[0],
                canceledSubscriptions: stats[1],
                expiredSubscriptions: stats[2],
                successfulValidations: stats[3],
                failedValidations: stats[4],
                totalSubscriptions: stats[0] + stats[1] + stats[2]
            }
        })

    } catch (error: any) {
        console.error('Erro ao buscar estatísticas admin:', error)
        throw new InternalServerError({
            message: 'Erro interno ao buscar estatísticas'
        })
    }
}
