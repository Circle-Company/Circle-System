import { BaseUser } from "./baseUser"
import { RateLimit, StorageLimit, MonthlyLimits, BoostType } from "../../services/user-service/types"

/**
 * Implementação para usuários gratuitos
 * Define limites restritivos e acesso apenas a features básicas
 */
export class FreeUser extends BaseUser {
    
    /**
     * Retorna o tipo do usuário
     */
    getUserType(): string {
        return 'free'
    }

    /**
     * Features disponíveis para usuários gratuitos
     */
    async canAccessFeature(feature: string): Promise<boolean> {
        const freeFeatures = [
            'basic_posting',
            'basic_search', 
            'basic_profile',
            'follow_users',
            'like_comments',
            'view_moments',
            'basic_notifications'
        ]
        
        return freeFeatures.includes(feature)
    }

    /**
     * Rate limits restritivos para usuários gratuitos
     */
    getRateLimit(endpoint: string): RateLimit {
        const limits: Record<string, RateLimit> = {
            'POST /api/moments': { 
                requests: 5, 
                window: '1h',
                burst: 2
            },
            'POST /api/users/follow': { 
                requests: 10, 
                window: '1h',
                burst: 3
            },
            'GET /api/search': { 
                requests: 20, 
                window: '1h',
                burst: 5
            },
            'GET /api/users': { 
                requests: 30, 
                window: '1h',
                burst: 10
            },
            'POST /api/moments/like': { 
                requests: 20, 
                window: '1h',
                burst: 5
            },
            'POST /api/moments/comment': { 
                requests: 15, 
                window: '1h',
                burst: 3
            },
            'GET /api/analytics': { 
                requests: 0, 
                window: '1h',
                burst: 0  // Não permitido para free
            },
            'default': { 
                requests: 100, 
                window: '15m',
                burst: 20
            }
        }
        
        return limits[endpoint] || limits.default
    }

    /**
     * Limites de armazenamento para usuários gratuitos
     */
    getStorageLimit(): StorageLimit {
        return {
            totalMB: 100,                    // 100MB total
            videoDurationMax: 300,           // 5 minutos máximo por vídeo
            imagesMax: 50,                   // 50 imagens máximo
            memoriesMax: 5,                  // 5 memórias máximo
            momentsPerDay: 5,                // 5 posts por dia
            videoResolution: 'SD',           // Resolução standard
            imageQuality: 'medium'           // Qualidade média
        }
    }

    /**
     * Limites mensais para usuários gratuitos
     */
    getMonthlyLimits(): MonthlyLimits {
        return {
            posts: 150,          // 5 por dia x 30 dias
            likes: 600,          // 20 por dia x 30 dias
            comments: 300,       // 10 por dia x 30 dias
            follows: 60,         // 2 por dia x 30 dias
            searches: 300,       // 10 por dia x 30 dias
            profile_views: 100,  // Limite baixo para views de perfil
            boosts: 0            // Nenhum boost permitido
        }
    }

    /**
     * Usuários gratuitos não podem fazer boost
     */
    async canBoostMoment(type: BoostType): Promise<boolean> {
        return false
    }

    /**
     * Prioridade mais baixa para usuários gratuitos
     */
    getPriorityLevel(): number {
        return 1 // Prioridade mínima
    }

    // ==================== MÉTODOS ESPECÍFICOS FREE ====================

    /**
     * Verifica se atingiu limite diário de posts
     */
    async canPostToday(): Promise<boolean> {
        const usage = await this.getFeatureUsageStats('posts_daily')
        return usage.current < this.getStorageLimit().momentsPerDay
    }

    /**
     * Retorna posts restantes hoje
     */
    async getPostsRemainingToday(): Promise<number> {
        const usage = await this.getFeatureUsageStats('posts_daily')
        const limit = this.getStorageLimit().momentsPerDay
        return Math.max(0, limit - usage.current)
    }

    /**
     * Verifica se pode fazer upload de mídia
     */
    async canUploadMedia(sizeInMB: number, type: 'image' | 'video'): Promise<boolean> {
        const currentUsage = await this.getCurrentStorageUsage()
        const limits = this.getStorageLimit()
        
        // Verificar espaço total
        if (currentUsage + sizeInMB > limits.totalMB) {
            return false
        }
        
        // Verificar limite específico do tipo
        if (type === 'image') {
            const imageCount = await this.getCurrentImageCount()
            return imageCount < limits.imagesMax
        }
        
        return true
    }

    /**
     * Retorna sugestão de upgrade personalizada
     */
    getUpgradeSuggestion(blockedFeature: string): object {
        const suggestions = {
            'moment_boost': {
                title: 'Destaque seus momentos!',
                description: 'Com Circle Premium você pode fazer boost dos seus momentos e alcançar muito mais pessoas.',
                benefits: ['30 boosts por mês', 'Aparece primeiro no feed', 'Até 10x mais visualizações'],
                cta: 'Upgrade para Premium'
            },
            'advanced_search': {
                title: 'Encontre pessoas incríveis!',
                description: 'Busca avançada para encontrar pessoas por interesses, localização e muito mais.',
                benefits: ['Filtros avançados', 'Mais resultados', 'Sugestões inteligentes'],
                cta: 'Upgrade para Premium'
            },
            'analytics_advanced': {
                title: 'Entenda sua audiência!',
                description: 'Analytics completo para ver quem visita seu perfil e como seus posts performam.',
                benefits: ['Quem visitou seu perfil', 'Analytics de posts', 'Estatísticas detalhadas'],
                cta: 'Upgrade para Premium'
            },
            'extended_storage': {
                title: 'Mais espaço para suas memórias!',
                description: 'Armazene muito mais fotos e vídeos com 100x mais espaço.',
                benefits: ['10GB de espaço', 'Vídeos HD até 1 hora', 'Memórias ilimitadas'],
                cta: 'Upgrade para Premium'
            },
            'default': {
                title: 'Desbloqueie o Circle Premium!',
                description: 'Acesse todas as funcionalidades premium e tenha a melhor experiência.',
                benefits: ['Sem limites', 'Prioridade no feed', 'Suporte prioritário'],
                cta: 'Upgrade para Premium'
            }
        }
        
        return suggestions[blockedFeature] || suggestions.default
    }

    // ==================== MÉTODOS PRIVADOS ====================

    private async getCurrentStorageUsage(): Promise<number> {
        // TODO: Implementar cálculo real do storage usage
        // Por enquanto retorna 0, mas deveria consultar o banco
        return 0
    }

    private async getCurrentImageCount(): Promise<number> {
        // TODO: Implementar contagem real de imagens
        // Por enquanto retorna 0, mas deveria consultar o banco
        return 0
    }

    /**
     * Serializa dados específicos do usuário gratuito
     */
    toJSON(): object {
        return {
            ...super.toJSON(),
            user_type: 'free',
            limits: {
                storage: this.getStorageLimit(),
                monthly: this.getMonthlyLimits(),
                rate_limits: {
                    posts_per_hour: this.getRateLimit('POST /api/moments').requests,
                    searches_per_hour: this.getRateLimit('GET /api/search').requests
                }
            },
            upgrade_available: true
        }
    }
}
