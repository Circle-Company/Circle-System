import { InternalServerError, UnauthorizedError, ValidationError, PaymentRequiredError } from "../../errors"
import { NextFunction, Request, Response } from "express"

import { UserService } from "../../services/user-service"
import { premiumValidation } from "../../middlewares/premium-validation"
import { UserFactory } from "../../classes/user/UserFactory"

export async function find_user_by_username(req: Request, res: Response) {
    const { username } = req.params
    const { user_id } = req.body
    try {
        const user = await UserService.UserFind.FindByUsername({ username, user_id })
        return res.status(200).json(user)
    } catch (err: any) {
        console.log(err)
    }
}

export async function find_user_by_pk(req: Request, res: Response) {
    const { user_pk } = req.params
    const { user_id } = req.body
    const user = await UserService.UserFind.FindByPk({ user_id, user_pk })
    return res.status(200).json(user)
}

export async function find_session_user_by_pk(req: Request, res: Response) {
    const { user_pk } = req.params
    const user = await UserService.UserFind.FindSessionByPk({ user_pk })
    return res.status(200).json(user)
}

export async function find_session_user_statistics_by_pk(req: Request, res: Response) {
    const { user_pk } = req.params
    const user = await UserService.UserFind.FindSessionStatisticsByPk({ user_pk })
    return res.status(200).json(user)
}

export async function find_user_data(req: Request, res: Response, next: NextFunction) {
    const { username } = req.params

    try {
        // Verifica se user_id está presente
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }

        // Carregar dados do usuário atual se não estiver carregado
        if (!req.user) {
            req.user = await UserFactory.createUser(req.user_id)
        }

        // Track feature usage
        await req.user.trackFeatureUsage('profile_views')

        // Verificar limites de visualização de perfil
        const isWithinLimit = await req.user.isWithinUsageLimit('profile_views')
        if (!isWithinLimit) {
            const remaining = await req.user.getRemainingUsage('profile_views')
            return res.status(429).json({
                error: "Monthly profile view limit reached",
                message: "You have reached your monthly limit for profile views",
                remaining_views: remaining,
                upgrade_suggestion: req.user.subscriptionTier === 'free' ? {
                    title: "Want to explore more profiles?",
                    description: "Premium users get 60x more profile views per month",
                    current_limit: "100 views/month",
                    premium_limit: "6,000 views/month",
                    features: ["Advanced search", "Profile highlights", "Analytics insights"],
                    action: "Upgrade to Premium"
                } : null
            })
        }

        // Busca os dados do usuário
        const user = await UserService.UserFind.FindAllData({ username, user_id: req.user_id })

        // Adicionar informações premium se disponível
        const canUseAnalytics = await req.user.canAccessFeature('analytics_advanced')
        const response: any = { ...user }

        if (canUseAnalytics) {
            response.premium_insights = {
                mutual_connections: await getMutualConnections(req.user_id, user.id),
                interaction_history: await getInteractionHistory(req.user_id, user.id),
                engagement_rate: await getEngagementRate(user.id),
                activity_patterns: await getActivityPatterns(user.id),
                insights: {
                    message: "Premium analytics: Enhanced profile insights",
                    features: ["Mutual connections", "Interaction history", "Activity patterns"]
                }
            }
        } else if (req.user.subscriptionTier === 'free') {
            response.upgrade_suggestion = {
                title: "Want deeper insights about this user?",
                description: "See mutual connections, interaction history, and activity patterns",
                features: ["See mutual friends", "Interaction timeline", "Activity insights", "Engagement metrics"],
                action: "Upgrade to Premium"
            }
        }

        // Retorna os dados do usuário encontrados
        return res.status(200).json(response)
    } catch (err: unknown) {
        console.error("Error finding user data:", err)

        // Verifica o tipo de erro e retorna a resposta apropriada
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

export async function search_user(req: Request, res: Response) {
    const { searchTerm } = req.body

    // Verifica se user_id está presente
    if (!req.user_id) {
        throw new UnauthorizedError({
            message: "User ID is missing. You must be authenticated to access this resource.",
        })
    }

    // Carregar dados do usuário atual se não estiver carregado
    if (!req.user) {
        req.user = await UserFactory.createUser(req.user_id)
    }

    // Verificar limites de busca
    const isWithinLimit = await req.user.isWithinUsageLimit('searches')
    if (!isWithinLimit) {
        const remaining = await req.user.getRemainingUsage('searches')
        return res.status(429).json({
            error: "Monthly search limit reached",
            message: "You have reached your monthly limit for searches",
            remaining_searches: remaining,
            upgrade_suggestion: req.user.subscriptionTier === 'free' ? {
                title: "Need more searches?",
                description: "Premium users get 50x more searches per month",
                current_limit: "300 searches/month",
                premium_limit: "15,000 searches/month",
                features: ["Advanced filters", "Location search", "Interest-based search"],
                action: "Upgrade to Premium"
            } : null
        })
    }

    // Track feature usage
    await req.user.trackFeatureUsage('searches')

    const search_result = await UserService.UserFind.SearchUser({
        searchTerm,
        userId: BigInt(req.user_id),
    })

    // Adicionar filtros premium se disponível
    const canUseAdvancedSearch = await req.user.canAccessFeature('advanced_search')
    if (canUseAdvancedSearch) {
        // TODO: Implementar filtros avançados premium
        search_result.premium_filters = {
            available: true,
            filters: ["Location", "Interests", "Mutual connections", "Activity level"],
            message: "Premium search: Use advanced filters for better results"
        }
    } else if (req.user.subscriptionTier === 'free') {
        search_result.upgrade_suggestion = {
            title: "Find exactly who you're looking for",
            description: "Premium search includes location, interests, and advanced filters",
            features: ["Location-based search", "Interest filters", "Mutual connection filters", "Activity filters"],
            action: "Upgrade to Premium"
        }
    }

    res.status(200).json(search_result)
}

export async function recommender_users(req: Request, res: Response) {
    const { user_id } = req.body

    // TODO: Implementar esta funcionalidade
    // const recommendations = await UserService.UserFind.RecommenderUsers({ user_id })
    res.status(501).json({ message: "Esta funcionalidade ainda não está implementada." })
}

export async function find_user_followers(req: Request, res: Response) {
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10

    if (!req.user_id) throw new InternalServerError({ message: "req.user_id can not be null." })
    const result = await UserService.UserFind.FinduserFollowers({
        user_pk: BigInt(req.params.id),
        user_id: BigInt(req.user_id),
        page,
        pageSize,
    })
    res.status(200).json(result)
}

// ==================== FUNÇÕES AUXILIARES PARA ANALYTICS PREMIUM ====================

async function getMutualConnections(currentUserId: bigint, targetUserId: bigint): Promise<any> {
    try {
        // TODO: Implementar busca real de conexões mútuas
        // Por enquanto retorna mock
        return {
            count: 5,
            preview: [
                { id: "1", username: "alice_dev", name: "Alice" },
                { id: "2", username: "bob_designer", name: "Bob" },
                { id: "3", username: "carol_pm", name: "Carol" }
            ]
        }
    } catch (error) {
        console.error('Error getting mutual connections:', error)
        return null
    }
}

async function getInteractionHistory(currentUserId: bigint, targetUserId: bigint): Promise<any> {
    try {
        // TODO: Implementar histórico real de interações
        // Por enquanto retorna mock
        return {
            total_interactions: 23,
            last_interaction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            interaction_types: {
                likes: 12,
                comments: 5,
                shares: 3,
                profile_views: 3
            },
            frequency: "regular" // low, regular, high
        }
    } catch (error) {
        console.error('Error getting interaction history:', error)
        return null
    }
}

async function getEngagementRate(userId: bigint): Promise<any> {
    try {
        // TODO: Implementar cálculo real de engajamento
        // Por enquanto retorna mock
        return {
            overall_rate: "78%",
            trend: "increasing",
            comparison: "above_average"
        }
    } catch (error) {
        console.error('Error getting engagement rate:', error)
        return null
    }
}

async function getActivityPatterns(userId: bigint): Promise<any> {
    try {
        // TODO: Implementar análise real de padrões
        // Por enquanto retorna mock
        return {
            most_active_time: "evening",
            posting_frequency: "3-4 times per week",
            peak_days: ["Tuesday", "Thursday", "Saturday"],
            activity_score: 85
        }
    } catch (error) {
        console.error('Error getting activity patterns:', error)
        return null
    }
}

// Adicionar função de analytics premium para o próprio usuário
export async function get_premium_analytics(req: Request, res: Response) {
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

        // Verificar se pode usar analytics avançado
        const canUseAnalytics = await req.user.canAccessFeature('analytics_advanced')
        if (!canUseAnalytics) {
            throw new PaymentRequiredError({
                message: "Advanced analytics requires premium subscription",
                action: "Upgrade to Premium to see detailed analytics",
                renewal_url: "/upgrade-premium"
            })
        }

        const analytics = await getUserAnalytics(req.user_id)

        res.status(200).json({
            analytics,
            insights: {
                message: "Premium analytics: Complete insights about your account",
                features: ["Profile analytics", "Engagement metrics", "Growth tracking", "Audience insights"]
            }
        })

    } catch (err: unknown) {
        console.error("Error getting premium analytics:", err)
        if (err instanceof PaymentRequiredError) {
            res.status(402).json({
                error: "Payment Required",
                message: err.message,
                action: err.action,
                upgrade_suggestion: {
                    title: "Want detailed insights about your profile?",
                    description: "Premium analytics provide comprehensive data about your account performance",
                    features: [
                        "Profile view analytics",
                        "Engagement rate tracking", 
                        "Follower growth insights",
                        "Content performance metrics",
                        "Best posting times",
                        "Audience demographics"
                    ],
                    action: "Upgrade to Premium"
                }
            })
        } else {
            res.status(500).json({ 
                error: "Error getting analytics", 
                message: (err as any).message 
            })
        }
    }
}

async function getUserAnalytics(userId: bigint): Promise<any> {
    try {
        // TODO: Implementar analytics real
        // Por enquanto retorna mock detalhado
        return {
            profile_performance: {
                views_this_month: 1240,
                views_last_month: 890,
                growth_rate: "+39%",
                unique_viewers: 1100,
                return_visitors: 140
            },
            engagement_metrics: {
                average_engagement_rate: "12.4%",
                likes_per_post: 45,
                comments_per_post: 8,
                shares_per_post: 3,
                engagement_trend: "increasing"
            },
            follower_insights: {
                new_followers_this_month: 156,
                lost_followers_this_month: 23,
                net_growth: 133,
                follower_retention_rate: "94%",
                growth_trend: "steady_increase"
            },
            content_performance: {
                best_performing_post_type: "video",
                optimal_posting_times: ["19:00-21:00", "12:00-14:00"],
                hashtag_performance: {
                    top_hashtags: ["#tech", "#circle", "#social"],
                    avg_reach_per_hashtag: 2300
                }
            },
            audience_demographics: {
                age_groups: {
                    "18-24": "35%",
                    "25-34": "45%", 
                    "35-44": "20%"
                },
                top_locations: ["São Paulo", "Rio de Janeiro", "Belo Horizonte"],
                interests: ["Technology", "Design", "Photography"]
            },
            recommendations: [
                "Post between 7-9 PM for maximum engagement",
                "Video content gets 3x more engagement than images",
                "Your followers are most active on weekday evenings"
            ]
        }
    } catch (error) {
        console.error('Error getting user analytics:', error)
        return null
    }
}
