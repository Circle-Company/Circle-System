import { Request, Response } from "express"
import { ValidationError } from "../../errors"
import Follow from "../../models/user/follow-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model"
import User from "../../models/user/user-model"
import { premiumValidation } from "../../middlewares/premium-validation"

export async function findAccountFollowings(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new ValidationError({
                message: "User ID is required to fetch followings.",
                action: "Ensure the user is authenticated and their ID is provided.",
            })
        }

        // Validações e benefícios premium para visualização de seguidores
        let limit = parseInt(req.query.limit as string, 10) || 10
        const page = parseInt(req.query.page as string, 10) || 1
        
        if (req.user) {
            // Usuários premium podem ver mais seguidores por página
            const maxLimit = req.user.subscriptionTier === 'premium' ? 50 : 20
            limit = Math.min(limit, maxLimit)
            
            // Track feature usage
            await req.user.trackFeatureUsage('view_followings')
            
            // Verificar se pode usar analytics avançado
            const canUseAnalytics = await req.user.canAccessFeature('analytics_advanced')
            req.includeAnalytics = canUseAnalytics
        }
        
        const offset = (page - 1) * limit

        // Consulta paginada
        const { rows: followingUsers, count: totalItems } = await Follow.findAndCountAll({
            where: { user_id: String(req.user_id) },
            attributes: ["created_at"],
            include: [
                {
                    model: User,
                    as: "followers",
                    where: { blocked: false, deleted: false },
                    attributes: ["id", "username", "name", "verifyed"],
                    include: [
                        {
                            model: ProfilePicture,
                            as: "profile_pictures",
                            attributes: ["tiny_resolution"],
                        },
                        {
                            model: Statistic,
                            as: "statistics",
                            attributes: ["total_followers_num"],
                        },
                    ],
                },
            ],
            limit,
            offset,
        })

        // Converter IDs para string antes de retornar
        const filteredList = followingUsers.map((item: any) => {
            // Verificar se item.followers existe e tem id
            const followerId = item?.followers?.id
            return {
                id: followerId ? followerId.toString() : null, // Converter para string
                username: item?.followers?.username,
                verifyed: item?.followers?.verifyed,
                profile_picture: item?.followers?.profile_pictures,
                statistic: item?.followers?.statistics,
                followed_at: item?.created_at,
            }
        })

        // Construção do objeto de paginação
        const totalPages = Math.ceil(totalItems / limit)

        // Resposta base
        const response: any = {
            data: filteredList,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        }

        // Adicionar analytics premium se disponível
        if (req.user && req.includeAnalytics) {
            response.premium_analytics = {
                followings_growth: await getFollowingsGrowth(req.user_id),
                mutual_connections: await getMutualConnections(req.user_id, filteredList),
                engagement_rate: await getFollowingsEngagementRate(req.user_id),
                top_interactions: await getTopInteractions(req.user_id),
                insights: {
                    message: "Premium analytics: Track your network growth and engagement",
                    features: ["Growth tracking", "Mutual connections", "Engagement insights"]
                }
            }
        } else if (req.user && req.user.subscriptionTier === 'free') {
            response.upgrade_suggestion = {
                title: "Want to see who engages most with your content?",
                description: "Premium analytics show engagement rates, mutual connections, and growth trends",
                features: ["See mutual friends", "Track follower growth", "Engagement insights", "Network analytics"],
                action: "Upgrade to Premium"
            }
        }

        res.status(200).json(response)
    } catch (error: any) {
        // Tipo 'any' para acessar propriedades como 'statusCode'
        console.error("Error fetching following users:", error)

        if (error instanceof ValidationError) {
            // Erro de validação conhecido (ex: user_id faltando)
            return res.status(error.statusCode || 400).json({
                message: error.message,
                action: error.action,
                key: error.key,
            })
        } else {
            // Outros erros (ex: erro de banco de dados)
            return res.status(500).json({
                message: "An internal server error occurred while fetching followings.",
                // Opcional: Adicionar error ID para rastreamento
                // errorId: (error instanceof BaseError) ? error.errorId : undefined
            })
        }
    }
}

// ==================== FUNÇÕES AUXILIARES PARA ANALYTICS PREMIUM ====================

async function getFollowingsGrowth(userId: bigint): Promise<any> {
    try {
        // TODO: Implementar cálculo real de crescimento de seguidores
        // Por enquanto retorna mock, mas deveria calcular crescimento nos últimos 30 dias
        return {
            last_30_days: 15,
            growth_rate: "+12%",
            trend: "increasing"
        }
    } catch (error) {
        console.error('Error calculating followings growth:', error)
        return null
    }
}

async function getMutualConnections(userId: bigint, followingsList: any[]): Promise<any> {
    try {
        // TODO: Implementar busca real de conexões mútuas
        // Por enquanto retorna mock
        return {
            count: 8,
            preview: followingsList.slice(0, 3).map(user => ({
                id: user.id,
                username: user.username,
                mutual_count: Math.floor(Math.random() * 20) + 1
            }))
        }
    } catch (error) {
        console.error('Error calculating mutual connections:', error)
        return null
    }
}

async function getFollowingsEngagementRate(userId: bigint): Promise<any> {
    try {
        // TODO: Implementar cálculo real de engajamento
        // Por enquanto retorna mock
        return {
            average_rate: "78%",
            top_engagers: 5,
            engagement_trend: "stable"
        }
    } catch (error) {
        console.error('Error calculating engagement rate:', error)
        return null
    }
}

async function getTopInteractions(userId: bigint): Promise<any> {
    try {
        // TODO: Implementar busca de top interações
        // Por enquanto retorna mock
        return {
            most_liked_by: [],
            most_commented_by: [],
            most_shared_by: []
        }
    } catch (error) {
        console.error('Error getting top interactions:', error)
        return null
    }
}

// Extend Request interface para incluir propriedades customizadas
declare global {
    namespace Express {
        interface Request {
            includeAnalytics?: boolean
            imageQualitySettings?: {
                compression: number
                resolution: string
            }
        }
    }
}
