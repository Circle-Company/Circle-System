import { InternalServerError, UnauthorizedError, PaymentRequiredError } from "../../errors"
import { Request, Response } from "express"

// Importações para integração Swipe Engine
import { FeedbackProcessor } from "../../swipe-engine/core/feedback/FeedbackProcessor"
import { MomentService } from "../../services/moment-service"
import { PostEmbeddingService } from "../../swipe-engine/core/embeddings/PostEmbeddingService"
import Report from '../../models/user/report-model.js'
import { StatusCodes } from "http-status-codes"
import { UserEmbeddingService } from "../../swipe-engine/core/embeddings/UserEmbeddingService"
import { ValidationError } from "sequelize"
import { getLogger } from "../../swipe-engine/core/utils/logger"
import { premiumValidation } from "../../middlewares/premium-validation"
import { UserFactory } from "../../classes/user/UserFactory"

const logger = getLogger("moment-actions-controller")
const userEmbeddingService = new UserEmbeddingService()
const postEmbeddingService = new PostEmbeddingService()
const feedbackProcessor = new FeedbackProcessor(userEmbeddingService, postEmbeddingService, logger)

export async function view_moment(req: Request, res: Response) {
    const result = await MomentService.Actions.View({
        user_id: req.user_id,
        moment_id: req.params.id,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function like_moment(req: Request, res: Response) {
    // Validações premium para likes
    if (req.user) {
        // Verificar limites mensais de likes
        const isWithinLimit = await req.user.isWithinUsageLimit('likes')
        if (!isWithinLimit) {
            const remaining = await req.user.getRemainingUsage('likes')
            return res.status(429).json({
                error: "Monthly like limit reached",
                message: "You have reached your monthly limit for likes",
                remaining_likes: remaining,
                upgrade_suggestion: req.user.subscriptionTier === 'free' ? {
                    title: "Love to like more content?",
                    description: "Premium users get 60x more likes per month",
                    current_limit: "600 likes/month",
                    premium_limit: "12,000 likes/month",
                    features: ["Super-like reactions", "Priority visibility", "Analytics insights"],
                    action: "Upgrade to Premium"
                } : null
            })
        }

        // Track feature usage
        await req.user.trackFeatureUsage('likes')
    }

    const result = await MomentService.Actions.Like({
        user_id: req.user_id,
        moment_id: req.params.id,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function unlike_moment(req: Request, res: Response) {
    const result = await MomentService.Actions.Unlike({
        user_id: req.user_id,
        moment_id: req.params.id,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function comment_on_moment(req: Request, res: Response) {
    if (!req.user_id) {
        throw new UnauthorizedError({
            message: "User ID is missing. You must be authenticated to access this resource.",
        })
    }
    
    // Validações premium para comentários
    if (req.user) {
        // Verificar limites mensais de comentários
        const isWithinLimit = await req.user.isWithinUsageLimit('comments')
        if (!isWithinLimit) {
            const remaining = await req.user.getRemainingUsage('comments')
            return res.status(429).json({
                error: "Monthly comment limit reached", 
                message: "You have reached your monthly limit for comments",
                remaining_comments: remaining,
                upgrade_suggestion: req.user.subscriptionTier === 'free' ? {
                    title: "Want to engage more with the community?",
                    description: "Premium users get 10x more comments per month",
                    current_limit: "300 comments/month",
                    premium_limit: "3,000 comments/month", 
                    features: ["Rich text formatting", "Priority visibility", "Longer comments"],
                    action: "Upgrade to Premium"
                } : null
            })
        }

        // Verificar comprimento de comentário baseado no tier
        const maxCommentLength = req.user.subscriptionTier === 'premium' ? 1000 : 280
        if (req.body.comment_content && req.body.comment_content.length > maxCommentLength) {
            return res.status(400).json({
                error: "Comment too long",
                message: `Comments must be ${maxCommentLength} characters or less`,
                current_length: req.body.comment_content.length,
                max_length: maxCommentLength,
                upgrade_suggestion: req.user.subscriptionTier === 'free' ? {
                    title: "Need longer comments?",
                    description: "Premium users can write comments up to 1000 characters",
                    premium_limit: "1000 characters",
                    action: "Upgrade to Premium"
                } : null
            })
        }

        // Track feature usage
        await req.user.trackFeatureUsage('comments')
    }
    
    if (!req.params.id)
        throw new InternalServerError({
            message: "req.params.id is missing.",
            action: "Verify if your request is passing params correctly.",
        })
    const result = await MomentService.Actions.CommentOnMoment({
        user_id: req.user_id,
        moment_id: BigInt(req.params.id),
        content: req.body.content,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function reply_comment_on_moment(req: Request, res: Response) {
    const { user_id, moment_id, parent_comment_id, content } = req.body
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const result = await MomentService.Actions.ReplyCommentOnMoment({
        user_id,
        moment_id,
        parent_comment_id,
        content,
        page,
        pageSize,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function like_comment(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        if (!req.params.id)
            throw new InternalServerError({
                message: "req.params.id is missing.",
                action: "Verify if your request is passing params correctly.",
            })
        const result = await MomentService.Actions.LikeComment({
            comment_id: BigInt(req.params.id),
            user_id: req.user_id,
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error("Error when liking the comment:", err)

        // Verifica o tipo de erro e retorna a resposta apropriada
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err })
        } else if (err instanceof UnauthorizedError) {
            return res.status(401).json({ error: err })
        } else {
            // Em caso de erro interno inesperado, retorna um status 500
            return res.status(500).json({ error: "An unexpected error occurred." })
        }
    }
}

export async function unlike_comment(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        if (!req.params.id)
            throw new InternalServerError({
                message: "req.params.id is missing.",
                action: "Verify if your request is passing params correctly.",
            })
        const result = await MomentService.Actions.UnlikeComment({
            comment_id: BigInt(req.params.id),
            user_id: req.user_id,
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error("Error when unlike comment:", err)
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message })
        } else if (err instanceof UnauthorizedError) {
            return res.status(401).json({ error: err.message })
        } else {
            // Em caso de erro interno inesperado, retorna um status 500
            return res.status(500).json({ error: "An unexpected error occurred." })
        }
    }
}

export async function hide_moment(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        if (!req.params.id)
            throw new InternalServerError({
                message: "req.params.id is missing.",
                action: "Verify if your request is passing params correctly.",
            })
        const result = await MomentService.Actions.Hide({
            moment_id: BigInt(req.params.id),
            user_id: req.user_id,
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error("Error trying hide moment:", err)
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message })
        } else if (err instanceof UnauthorizedError) {
            return res.status(401).json({ error: err.message })
        } else {
            // Em caso de erro interno inesperado, retorna um status 500
            return res.status(500).json({ error: "An unexpected error occurred." })
        }
    }
}

export async function unhide_moment(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        if (!req.params.id)
            throw new InternalServerError({
                message: "req.params.id is missing.",
                action: "Verify if your request is passing params correctly.",
            })
        const result = await MomentService.Actions.Unhide({
            moment_id: BigInt(req.params.id),
            user_id: req.user_id,
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error("Error trying unhide moment:", err)
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message })
        } else if (err instanceof UnauthorizedError) {
            return res.status(401).json({ error: err.message })
        } else {
            // Em caso de erro interno inesperado, retorna um status 500
            return res.status(500).json({ error: "An unexpected error occurred." })
        }
    }
}

export async function delete_moment(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        if (!req.params.id)
            throw new InternalServerError({
                message: "req.params.id is missing.",
                action: "Verify if your request is passing params correctly.",
            })
        const result = await MomentService.Actions.Delete({
            moment_id: BigInt(req.params.id),
            user_id: req.user_id,
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error("Error trying delete moment:", err)
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message })
        } else if (err instanceof UnauthorizedError) {
            return res.status(401).json({ error: err.message })
        } else {
            // Em caso de erro interno inesperado, retorna um status 500
            return res.status(500).json({ error: "An unexpected error occurred." })
        }
    }
}

export async function delete_moment_list(req: Request, res: Response) {
    const { moment_ids_list } = req.body
    if (!req.user_id) {
        throw new UnauthorizedError({
            message: "User ID is missing. You must be authenticated to access this resource.",
        })
    }
    const result = await MomentService.Actions.DeleteList({
        moment_ids_list,
        user_id: req.user_id,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function undelete_moment(req: Request, res: Response) {
    if (!req.user_id) {
        throw new UnauthorizedError({
            message: "User ID is missing. You must be authenticated to access this resource.",
        })
    }
    if (!req.params.id)
        throw new InternalServerError({
            message: "req.params.id is missing.",
            action: "Verify if your request is passing params correctly.",
        })
    const result = await MomentService.Actions.Undelete({
        moment_id: BigInt(req.params.id),
        user_id: req.user_id,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function report_moment(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        if (!req.params.id)
            throw new InternalServerError({
                message: "req.params.id is missing.",
                action: "Verify if your request is passing params correctly.",
            })
        if (!req.body.report_type) {
            throw new InternalServerError({
                message: "report_type is missing.",
                action: "Informe o tipo de report (ex: SPAM, VIOLENCE, etc)",
            })
        }
        await Report.create({
            user_id: req.user_id,
            reported_content_id: BigInt(req.params.id),
            reported_content_type: 'MOMENT',
            report_type: req.body.report_type
        })
        // Integração Swipe Engine: registrar interação de report
        try {
            await feedbackProcessor.processInteraction({
                id: `${req.user_id}-${req.params.id}-${Date.now()}`,
                userId: BigInt(req.user_id),
                entityId: BigInt(req.params.id),
                entityType: "post",
                type: "report",
                timestamp: new Date(),
                metadata: { report_type: req.body.report_type }
            })
        } catch (feedbackErr) {
            logger.error("Erro ao atualizar embedding (report_moment)", feedbackErr)
        }
        res.status(StatusCodes.ACCEPTED).json({ success: true })
    } catch (err: unknown) {
        console.error("Error when reporting moment:", err)
        res.status(500).json({ error: "Erro ao reportar momento.", message: (err as any).message })
    }
}

export async function report_comment_on_moment(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        if (!req.params.id)
            throw new InternalServerError({
                message: "req.params.id is missing.",
                action: "Verifique se o parâmetro id do comentário está sendo passado corretamente.",
            })
        if (!req.body.report_type) {
            throw new InternalServerError({
                message: "report_type is missing.",
                action: "Informe o tipo de report (ex: SPAM, VIOLENCE, etc)",
            })
        }
        await Report.create({
            user_id: req.user_id,
            reported_content_id: BigInt(req.params.id),
            reported_content_type: 'COMMENT',
            report_type: req.body.report_type
        })
        // Integração Swipe Engine: registrar interação de report para comentário
        try {
            await feedbackProcessor.processInteraction({
                id: `${req.user_id}-${req.params.id}-${Date.now()}`,
                userId: BigInt(req.user_id),
                entityId: BigInt(req.params.id),
                entityType: "post",
                type: "report",
                timestamp: new Date(),
                metadata: { report_type: req.body.report_type }
            })
        } catch (feedbackErr) {
            logger.error("Erro ao atualizar embedding (report_comment_on_moment)", feedbackErr)
        }
        res.status(StatusCodes.ACCEPTED).json({ success: true })
    } catch (err: unknown) {
        console.error("Error when reporting comment:", err)
        res.status(500).json({ error: "Erro ao reportar comentário.", message: (err as any).message })
    }
}

// ==================== FUNCIONALIDADES PREMIUM - BOOST DE MOMENTOS ====================

export async function boost_moment(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }

        if (!req.params.id) {
            throw new InternalServerError({
                message: "Moment ID is missing.",
                action: "Verify if your request is passing the moment ID correctly.",
            })
        }

        const { boost_type = 'engagement', duration_hours = 24 } = req.body

        // Carregar dados do usuário se não estiver carregado
        if (!req.user) {
            req.user = await UserFactory.createUser(req.user_id)
        }

        // Verificar se pode fazer boost
        const canBoost = await req.user.canBoostMoment(boost_type)
        if (!canBoost) {
            throw new PaymentRequiredError({
                message: "Moment boost requires premium subscription",
                action: "Upgrade to Premium to boost your moments",
                renewal_url: "/upgrade-premium"
            })
        }

        // Verificar limites mensais de boost
        const isWithinLimit = await req.user.isWithinUsageLimit('boosts')
        if (!isWithinLimit) {
            const remaining = await req.user.getRemainingUsage('boosts')
            return res.status(429).json({
                error: "Monthly boost limit reached",
                message: "You have reached your monthly limit for boosts",
                remaining_boosts: remaining,
                upgrade_suggestion: {
                    title: "Need more boosts?",
                    description: "Premium users get 30 boosts per month",
                    current_limit: "30 boosts/month",
                    features: ["3 boost types", "Up to 10x visibility", "Analytics tracking"],
                    action: "Your limit resets next month"
                }
            })
        }

        // Verificar se o momento pertence ao usuário
        const moment = await MomentService.Find.FindById({
            moment_id: req.params.id,
            user_id: req.user_id
        })

        if (!moment || moment.user_id !== req.user_id) {
            return res.status(403).json({
                error: "Forbidden",
                message: "You can only boost your own moments"
            })
        }

        // Aplicar boost
        const boostResult = await applyMomentBoost({
            moment_id: BigInt(req.params.id),
            user_id: req.user_id,
            boost_type,
            duration_hours
        })

        // Track usage
        await req.user.trackFeatureUsage('boosts')

        // Integração com Swipe Engine para prioridade
        try {
            await feedbackProcessor.processInteraction({
                id: `boost-${req.user_id}-${req.params.id}-${Date.now()}`,
                userId: BigInt(req.user_id),
                entityId: BigInt(req.params.id),
                entityType: "post",
                type: "boost",
                timestamp: new Date(),
                metadata: { 
                    boost_type,
                    duration_hours,
                    boost_multiplier: getBoostMultiplier(boost_type)
                }
            })
        } catch (feedbackErr) {
            logger.error("Erro ao atualizar embedding (boost_moment)", feedbackErr)
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            boost: boostResult,
            message: `Moment boosted with ${boost_type} for ${duration_hours} hours`,
            analytics: {
                expected_increase: getBoostMultiplier(boost_type),
                expires_at: new Date(Date.now() + duration_hours * 60 * 60 * 1000),
                remaining_boosts: await req.user.getRemainingUsage('boosts')
            }
        })

    } catch (err: unknown) {
        console.error("Error boosting moment:", err)
        if (err instanceof PaymentRequiredError) {
            res.status(402).json({
                error: "Payment Required",
                message: err.message,
                action: err.action,
                renewal_url: err.renewal_url,
                upgrade_benefits: {
                    title: "Boost your moments with Premium!",
                    features: [
                        "30 boosts per month",
                        "3 types of boost (engagement, temporal, visibility)",
                        "Up to 10x more reach",
                        "Detailed boost analytics",
                        "Priority in feed"
                    ]
                }
            })
        } else {
            res.status(500).json({ 
                error: "Error boosting moment", 
                message: (err as any).message 
            })
        }
    }
}

export async function get_boost_analytics(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }

        // Carregar dados do usuário se não estiver carregado
        if (!req.user) {
            req.user = await UserFactory.createUser(req.user_id)
        }

        // Verificar se pode ver analytics
        const canUseAnalytics = await req.user.canAccessFeature('analytics_advanced')
        if (!canUseAnalytics) {
            throw new PaymentRequiredError({
                message: "Boost analytics requires premium subscription",
                action: "Upgrade to Premium to see detailed boost analytics",
                renewal_url: "/upgrade-premium"
            })
        }

        const analytics = await getBoostAnalytics(req.user_id, req.params.id)

        res.status(StatusCodes.OK).json({
            analytics,
            insights: {
                message: "Premium boost analytics: Track your moment's performance",
                features: ["Performance metrics", "Reach analysis", "Engagement tracking"]
            }
        })

    } catch (err: unknown) {
        console.error("Error getting boost analytics:", err)
        if (err instanceof PaymentRequiredError) {
            res.status(402).json({
                error: "Payment Required",
                message: err.message,
                action: err.action,
                upgrade_suggestion: {
                    title: "Want to see how your boosts perform?",
                    description: "Premium analytics show detailed boost performance metrics",
                    features: ["Boost performance tracking", "Reach increase analytics", "ROI insights"],
                    action: "Upgrade to Premium"
                }
            })
        } else {
            res.status(500).json({ 
                error: "Error getting boost analytics", 
                message: (err as any).message 
            })
        }
    }
}

export async function cancel_boost(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }

        if (!req.params.id) {
            throw new InternalServerError({
                message: "Moment ID is missing.",
                action: "Verify if your request is passing the moment ID correctly.",
            })
        }

        // Cancelar boost
        const cancelResult = await cancelMomentBoost({
            moment_id: BigInt(req.params.id),
            user_id: req.user_id
        })

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Boost cancelled successfully",
            refund: cancelResult.refund_applicable ? "Partial refund applied" : "No refund applicable"
        })

    } catch (err: unknown) {
        console.error("Error cancelling boost:", err)
        res.status(500).json({ 
            error: "Error cancelling boost", 
            message: (err as any).message 
        })
    }
}

// ==================== FUNÇÕES AUXILIARES PARA BOOST ====================

async function applyMomentBoost(params: {
    moment_id: bigint
    user_id: bigint
    boost_type: string
    duration_hours: number
}): Promise<any> {
    try {
        // TODO: Implementar aplicação real do boost
        // Por enquanto retorna mock, mas deveria:
        // 1. Criar registro na tabela moment_boosts
        // 2. Ajustar algoritmo de ranking
        // 3. Notificar sistemas de recomendação
        
        return {
            id: `boost_${Date.now()}`,
            moment_id: params.moment_id,
            boost_type: params.boost_type,
            multiplier: getBoostMultiplier(params.boost_type),
            starts_at: new Date(),
            expires_at: new Date(Date.now() + params.duration_hours * 60 * 60 * 1000),
            status: 'active'
        }
    } catch (error) {
        console.error('Error applying moment boost:', error)
        throw error
    }
}

async function getBoostAnalytics(userId: bigint, momentId?: string): Promise<any> {
    try {
        // TODO: Implementar analytics real
        // Por enquanto retorna mock
        return {
            total_boosts_used: 12,
            current_month_boosts: 5,
            boost_performance: {
                average_reach_increase: "340%",
                best_performing_boost: "engagement",
                total_additional_views: 2840,
                engagement_rate_improvement: "156%"
            },
            recent_boosts: [
                {
                    moment_id: momentId || "123",
                    boost_type: "engagement",
                    performance: "Great",
                    reach_increase: "400%",
                    boosted_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            ],
            recommendations: [
                "Your engagement boosts perform 20% better than temporal boosts",
                "Consider boosting content between 7-9 PM for maximum reach",
                "Posts with videos have 3x better boost performance"
            ]
        }
    } catch (error) {
        console.error('Error getting boost analytics:', error)
        return null
    }
}

async function cancelMomentBoost(params: {
    moment_id: bigint
    user_id: bigint
}): Promise<any> {
    try {
        // TODO: Implementar cancelamento real
        // Por enquanto retorna mock
        return {
            success: true,
            refund_applicable: false,
            message: "Boost cancelled successfully"
        }
    } catch (error) {
        console.error('Error cancelling boost:', error)
        throw error
    }
}

function getBoostMultiplier(boostType: string): string {
    const multipliers: Record<string, string> = {
        engagement: "3x engagement",
        temporal: "5x priority", 
        visibility: "10x reach"
    }
    return multipliers[boostType] || "3x"
}
