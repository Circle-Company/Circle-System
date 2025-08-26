import { Request, Response, NextFunction } from 'express'
import { PaymentRequiredError, UnauthorizedError, TooManyRequestsError } from '../errors'
import SubscriptionManager from '../services/subscription/SubscriptionManager'
import UserSubscription from '../models/subscription/user-subscription-model'
import { UserFactory } from '../classes/user/UserFactory'

declare global {
    namespace Express {
        interface Request {
            subscription?: UserSubscription
            isPremium?: boolean
        }
    }
}

/**
 * Middleware para validar se usuário tem assinatura premium ativa
 */
export async function requirePremiumSubscription(
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> {
    try {
        const userId = (req as any).user?.id || req.user_id

        if (!userId) {
            throw new UnauthorizedError({
                message: 'Usuário não autenticado',
                action: 'Faça login para acessar recursos premium'
            })
        }

        const subscriptionManager = new SubscriptionManager()
        const status = await subscriptionManager.getSubscriptionStatus(BigInt(userId))

        if (!status.hasActiveSubscription) {
            throw new PaymentRequiredError({
                message: 'Assinatura premium necessária',
                action: 'Assine o Circle Premium para acessar este recurso'
            })
        }

        // Adicionar dados da assinatura à requisição
        req.subscription = status.subscription
        req.isPremium = true

        next()

    } catch (error: any) {
        if (error instanceof PaymentRequiredError || error instanceof UnauthorizedError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                action: error.action,
                premium: false
            })
        } else {
            console.error('Erro no middleware de assinatura:', error)
            res.status(500).json({
                success: false,
                error: 'Erro interno ao verificar assinatura',
                premium: false
            })
        }
    }
}

/**
 * Middleware para verificar se usuário pode acessar uma feature específica
 */
export function requireFeatureAccess(featureName: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = (req as any).user?.id || req.user_id

            if (!userId) {
                throw new UnauthorizedError({
                    message: 'Usuário não autenticado',
                    action: 'Faça login para continuar'
                })
            }

            const user = await UserFactory.createUser(BigInt(userId))
            const canAccess = await user.canAccessFeature(featureName)

            if (!canAccess) {
                throw new PaymentRequiredError({
                    message: `Acesso negado à feature: ${featureName}`,
                    action: 'Assine o Circle Premium para acessar este recurso'
                })
            }

            // Adicionar informações do usuário à requisição
            req.isPremium = user.getUserType() === 'premium'

            next()

        } catch (error: any) {
            if (error instanceof PaymentRequiredError || error instanceof UnauthorizedError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    action: error.action,
                    feature: featureName
                })
            } else {
                console.error('Erro no middleware de feature:', error)
                res.status(500).json({
                    success: false,
                    error: 'Erro interno ao verificar acesso à feature'
                })
            }
        }
    }
}

/**
 * Middleware para verificar rate limits baseados na assinatura
 */
export function checkSubscriptionRateLimit(endpoint: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = (req as any).user?.id || req.user_id

            if (!userId) {
                throw new UnauthorizedError({
                    message: 'Usuário não autenticado'
                })
            }

            const user = await UserFactory.createUser(BigInt(userId))
            const rateLimit = user.getRateLimit(endpoint)

            // Aqui você implementaria a lógica de rate limiting
            // Por simplicidade, vamos apenas registrar o limite
            console.log(`Rate limit para ${endpoint}:`, rateLimit)

            // TODO: Implementar verificação real de rate limit
            // Poderia usar Redis ou cache em memória

            next()

        } catch (error: any) {
            if (error instanceof UnauthorizedError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    action: error.action
                })
            } else {
                console.error('Erro no middleware de rate limit:', error)
                res.status(500).json({
                    success: false,
                    error: 'Erro interno ao verificar rate limit'
                })
            }
        }
    }
}

/**
 * Middleware para verificar limites mensais de features
 */
export function checkMonthlyLimit(featureName: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = (req as any).user?.id || req.user_id

            if (!userId) {
                throw new UnauthorizedError({
                    message: 'Usuário não autenticado'
                })
            }

            const user = await UserFactory.createUser(BigInt(userId))
            const remainingUsage = await user.getRemainingUsage(featureName)

            if (remainingUsage === 0) {
                throw new PaymentRequiredError({
                    message: `Limite mensal esgotado para: ${featureName}`,
                    action: 'Aguarde o próximo mês ou assine o Circle Premium para limites maiores'
                })
            }

            // Adicionar informações à requisição
            req.isPremium = user.getUserType() === 'premium'

            next()

        } catch (error: any) {
            if (error instanceof PaymentRequiredError || error instanceof UnauthorizedError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    action: error.action,
                    feature: featureName
                })
            } else {
                console.error('Erro no middleware de limite mensal:', error)
                res.status(500).json({
                    success: false,
                    error: 'Erro interno ao verificar limite mensal'
                })
            }
        }
    }
}

/**
 * Middleware para adicionar informações de assinatura à resposta
 */
export async function addSubscriptionInfo(
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> {
    try {
        const userId = (req as any).user?.id || req.user_id

        if (userId) {
            const subscriptionManager = new SubscriptionManager()
            const status = await subscriptionManager.getSubscriptionStatus(BigInt(userId))
            const user = await UserFactory.createUser(BigInt(userId))

            // Adicionar informações à resposta
            const originalJson = res.json
            res.json = function(body: any) {
                if (body && typeof body === 'object') {
                    body.subscriptionInfo = {
                        hasActiveSubscription: status.hasActiveSubscription,
                        userType: user.getUserType(),
                        daysRemaining: status.daysRemaining,
                        nextRenewal: status.nextRenewal,
                        features: {
                            available: user.getAllFeatures(),
                            // accessible seria computado dinamicamente para cada feature
                        }
                    }
                }
                return originalJson.call(this, body)
            }
        }

        next()

    } catch (error: any) {
        console.error('Erro no middleware de informações de assinatura:', error)
        // Não bloquear a requisição em caso de erro
        next()
    }
}

/**
 * Middleware para validar webhook do Google Play
 */
export function validateGooglePlayWebhook(req: Request, res: Response, next: NextFunction): void {
    try {
        // Verificar se é uma requisição POST
        if (req.method !== 'POST') {
            res.status(405).json({
                success: false,
                error: 'Método não permitido'
            })
            return
        }

        // Verificar content-type
        if (!req.is('application/json')) {
            res.status(400).json({
                success: false,
                error: 'Content-Type deve ser application/json'
            })
            return
        }

        // Verificar se tem dados da mensagem
        if (!req.body || !req.body.message) {
            res.status(400).json({
                success: false,
                error: 'Dados da mensagem não encontrados'
            })
            return
        }

        next()

    } catch (error: any) {
        console.error('Erro na validação do webhook:', error)
        res.status(400).json({
            success: false,
            error: 'Erro na validação do webhook'
        })
    }
}

/**
 * Middleware para rate limiting específico do webhook
 */
export function webhookRateLimit(req: Request, res: Response, next: NextFunction): void {
    // TODO: Implementar rate limiting específico para webhooks
    // Por enquanto, apenas passar adiante
    next()
}

export default {
    requirePremiumSubscription,
    requireFeatureAccess,
    checkSubscriptionRateLimit,
    checkMonthlyLimit,
    addSubscriptionInfo,
    validateGooglePlayWebhook,
    webhookRateLimit
}
