import { Request, Response, NextFunction } from "express"
import { UnauthorizedError, PaymentRequiredError } from "../errors"
import { UserFactory } from "../classes/user/UserFactory"
import { BaseUser } from "../classes/user/baseUser"

/**
 * Interface estendida do Request para incluir dados do usuário
 */
declare global {
    namespace Express {
        interface Request {
            user?: BaseUser
            user_id?: bigint
        }
    }
}

/**
 * Middleware base para carregamento de usuário com cache
 */
export async function loadUserMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user_id) {
            return next(new UnauthorizedError({
                message: "Authentication required. Please provide a valid user ID."
            }))
        }

        // Carregar usuário usando a factory (com cache automático)
        const user = await UserFactory.createUser(req.user_id)
        req.user = user

        next()
    } catch (error) {
        console.error('Error loading user in middleware:', error)
        next(new UnauthorizedError({
            message: "Failed to authenticate user. Please try again."
        }))
    }
}

/**
 * Middleware para validar se usuário pode acessar uma feature específica
 */
export function requireFeature(featureName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(new UnauthorizedError({
                    message: "User not loaded. Please ensure authentication middleware is used."
                }))
            }

            const canAccess = await req.user.canAccessFeature(featureName)
            
            if (!canAccess) {
                const upgradeInfo = req.user.subscriptionTier === 'free' 
                    ? await getUpgradeInfo(req.user, featureName)
                    : { message: "Feature not available for your subscription tier" }

                return next(new PaymentRequiredError({
                    message: `Access to '${featureName}' requires premium subscription.`,
                    action: upgradeInfo.message,
                    renewal_url: "/upgrade-premium"
                }))
            }

            next()
        } catch (error) {
            console.error(`Error checking feature access for ${featureName}:`, error)
            next(new UnauthorizedError({
                message: "Failed to validate feature access. Please try again."
            }))
        }
    }
}

/**
 * Middleware para verificar limites de rate limiting baseado no tier do usuário
 */
export async function rateLimitMiddleware(endpoint: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(new UnauthorizedError({
                    message: "User not loaded for rate limiting."
                }))
            }

            const rateLimit = req.user.getRateLimit(endpoint)
            const userId = req.user.id
            
            // Verificar cache de rate limiting (implementação simplificada)
            const rateLimitKey = `rate_limit:${userId}:${endpoint}`
            const currentCount = await getRateLimitCount(rateLimitKey, rateLimit.window)
            
            if (currentCount >= rateLimit.requests) {
                return res.status(429).json({
                    error: "Rate limit exceeded",
                    message: `You have exceeded the rate limit of ${rateLimit.requests} requests per ${rateLimit.window}`,
                    retry_after: await getRetryAfter(rateLimitKey, rateLimit.window),
                    upgrade_suggestion: req.user.subscriptionTier === 'free' ? {
                        title: "Need more requests?",
                        description: "Upgrade to Premium for higher rate limits",
                        premium_limit: `${rateLimit.requests * 20} requests per ${rateLimit.window}`,
                        action: "Upgrade to Premium"
                    } : null
                })
            }

            // Incrementar contador
            await incrementRateLimitCount(rateLimitKey, rateLimit.window)
            
            // Adicionar headers informativos
            res.setHeader('X-RateLimit-Limit', rateLimit.requests)
            res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimit.requests - currentCount - 1))
            res.setHeader('X-RateLimit-Reset', await getResetTime(rateLimitKey, rateLimit.window))
            res.setHeader('X-User-Tier', req.user.subscriptionTier)

            next()
        } catch (error) {
            console.error(`Error in rate limiting for ${endpoint}:`, error)
            // Em caso de erro, permitir a requisição (fail-open)
            next()
        }
    }
}

/**
 * Middleware para tracking automático de uso de features
 */
export function trackFeatureUsage(featureName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.user) {
                // Fazer tracking em background para não afetar performance
                req.user.trackFeatureUsage(featureName).catch(error => {
                    console.error(`Error tracking feature usage for ${featureName}:`, error)
                })
            }
            next()
        } catch (error) {
            console.error(`Error in feature tracking middleware:`, error)
            next() // Continuar mesmo com erro no tracking
        }
    }
}

/**
 * Middleware para verificar limites de storage antes de uploads
 */
export function checkStorageLimit(fileSizeMB: number, fileType: 'image' | 'video') {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(new UnauthorizedError({
                    message: "User not loaded for storage validation."
                }))
            }

            const storageLimit = req.user.getStorageLimit()
            
            // Verificar tamanho do arquivo
            if (fileSizeMB > storageLimit.totalMB) {
                return res.status(413).json({
                    error: "File too large",
                    message: `File size ${fileSizeMB}MB exceeds your storage limit of ${storageLimit.totalMB}MB`,
                    current_limit: storageLimit.totalMB,
                    file_size: fileSizeMB,
                    upgrade_suggestion: req.user.subscriptionTier === 'free' ? {
                        title: "Need more storage?",
                        description: "Upgrade to Premium for 100x more storage space",
                        premium_storage: "10GB (10,000MB)",
                        action: "Upgrade to Premium"
                    } : null
                })
            }

            // Verificar qualidade permitida
            if (fileType === 'video') {
                const maxDuration = storageLimit.videoDurationMax
                req.maxVideoDuration = maxDuration
                req.videoResolution = storageLimit.videoResolution
            } else {
                req.imageQuality = storageLimit.imageQuality
            }

            next()
        } catch (error) {
            console.error('Error in storage limit middleware:', error)
            next(new UnauthorizedError({
                message: "Failed to validate storage limits."
            }))
        }
    }
}

/**
 * Middleware para validar limites mensais
 */
export function checkMonthlyLimit(limitType: 'posts' | 'likes' | 'comments' | 'follows' | 'searches') {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(new UnauthorizedError({
                    message: "User not loaded for monthly limit validation."
                }))
            }

            const isWithinLimit = await req.user.isWithinUsageLimit(limitType)
            
            if (!isWithinLimit) {
                const remaining = await req.user.getRemainingUsage(limitType)
                const stats = await req.user.getFeatureUsageStats(limitType)
                
                return res.status(429).json({
                    error: "Monthly limit exceeded",
                    message: `You have reached your monthly limit for ${limitType}`,
                    current_usage: stats.current,
                    limit: stats.limit,
                    reset_date: stats.resetDate,
                    upgrade_suggestion: req.user.subscriptionTier === 'free' ? {
                        title: `Reached your ${limitType} limit?`,
                        description: "Upgrade to Premium for much higher limits",
                        premium_benefits: await getPremiumBenefitsForLimit(limitType),
                        action: "Upgrade to Premium"
                    } : null
                })
            }

            next()
        } catch (error) {
            console.error(`Error checking monthly limit for ${limitType}:`, error)
            next()
        }
    }
}

/**
 * Middleware combinado para validação completa premium
 */
export function premiumValidation(options: {
    feature?: string
    endpoint?: string
    trackUsage?: string
    monthlyLimit?: 'posts' | 'likes' | 'comments' | 'follows' | 'searches'
    storageCheck?: { sizeMB: number, type: 'image' | 'video' }
}) {
    const middlewares: any[] = [loadUserMiddleware]
    
    if (options.feature) {
        middlewares.push(requireFeature(options.feature))
    }
    
    if (options.endpoint) {
        middlewares.push(rateLimitMiddleware(options.endpoint))
    }
    
    if (options.trackUsage) {
        middlewares.push(trackFeatureUsage(options.trackUsage))
    }
    
    if (options.monthlyLimit) {
        middlewares.push(checkMonthlyLimit(options.monthlyLimit))
    }
    
    if (options.storageCheck) {
        middlewares.push(checkStorageLimit(options.storageCheck.sizeMB, options.storageCheck.type))
    }

    return middlewares
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Retorna informações de upgrade personalizadas
 */
async function getUpgradeInfo(user: BaseUser, featureName: string) {
    // Cast para FreeUser se for o caso, para acessar método específico
    if (user.subscriptionTier === 'free' && 'getUpgradeSuggestion' in user) {
        return (user as any).getUpgradeSuggestion(featureName)
    }
    
    return {
        message: "This feature requires a premium subscription",
        benefits: ["Unlimited access", "Priority support", "Advanced features"],
        action: "Upgrade to Premium"
    }
}

/**
 * Funções de rate limiting (implementação simplificada - deveria usar Redis)
 */
const rateLimitCache = new Map<string, { count: number, resetTime: number }>()

async function getRateLimitCount(key: string, window: string): Promise<number> {
    const entry = rateLimitCache.get(key)
    if (!entry || Date.now() > entry.resetTime) {
        return 0
    }
    return entry.count
}

async function incrementRateLimitCount(key: string, window: string): Promise<void> {
    const windowMs = parseWindowToMs(window)
    const resetTime = Date.now() + windowMs
    
    const entry = rateLimitCache.get(key)
    if (!entry || Date.now() > entry.resetTime) {
        rateLimitCache.set(key, { count: 1, resetTime })
    } else {
        entry.count++
    }
}

async function getRetryAfter(key: string, window: string): Promise<number> {
    const entry = rateLimitCache.get(key)
    if (!entry) return 0
    return Math.max(0, Math.ceil((entry.resetTime - Date.now()) / 1000))
}

async function getResetTime(key: string, window: string): Promise<number> {
    const entry = rateLimitCache.get(key)
    if (!entry) return Math.ceil((Date.now() + parseWindowToMs(window)) / 1000)
    return Math.ceil(entry.resetTime / 1000)
}

function parseWindowToMs(window: string): number {
    const match = window.match(/^(\d+)([smhd])$/)
    if (!match) return 3600000 // default 1 hour
    
    const value = parseInt(match[1])
    const unit = match[2]
    
    switch (unit) {
        case 's': return value * 1000
        case 'm': return value * 60 * 1000
        case 'h': return value * 60 * 60 * 1000
        case 'd': return value * 24 * 60 * 60 * 1000
        default: return 3600000
    }
}

async function getPremiumBenefitsForLimit(limitType: string): Promise<string[]> {
    const benefits: Record<string, string[]> = {
        posts: ["3000 posts per month", "HD video uploads", "Priority in feed"],
        likes: ["12000 likes per month", "Super-like reactions", "Analytics insights"],
        comments: ["3000 comments per month", "Rich text formatting", "Priority visibility"],
        follows: ["600 follows per month", "Advanced user search", "Mutual connections"],
        searches: ["15000 searches per month", "Advanced filters", "Location-based search"]
    }
    
    return benefits[limitType] || ["Much higher limits", "Priority features", "Advanced tools"]
}

declare global {
    namespace Express {
        interface Request {
            maxVideoDuration?: number
            videoResolution?: string
            imageQuality?: string
        }
    }
}
