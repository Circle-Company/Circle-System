import { BaseUser } from "./baseUser"
import { RateLimit, StorageLimit, MonthlyLimits, BoostType } from "../../services/user-service/types"

/**
 * Implementação para usuários premium
 * Define limites generosos e acesso a todas as features premium
 */
export class PremiumUser extends BaseUser {
    
    /**
     * Retorna o tipo do usuário
     */
    getUserType(): string {
        return 'premium'
    }

    /**
     * Features disponíveis para usuários premium (acesso total)
     */
    async canAccessFeature(feature: string): Promise<boolean> {
        // Premium tem acesso a TODAS as features disponíveis
        const allFeatures = [
            // Features básicas (herda do free)
            'basic_posting', 'basic_search', 'basic_profile', 'follow_users', 
            'like_comments', 'view_moments', 'basic_notifications',
            
            // Features premium exclusivas
            'profile_highlight',
            'advanced_search',
            'moment_boost',
            'analytics_advanced',
            'priority_support',
            'higher_rate_limits',
            'extended_storage',
            'custom_themes',
            'badges_premium',
            'priority_notifications',
            'unlimited_memories',
            'video_hd_upload',
            'priority_feed_placement',
            'advanced_filters',
            'export_data',
            'ad_free_experience'
        ]
        
        // Para features básicas, sempre permitir
        if (this.isBasicFeature(feature)) {
            return true
        }
        
        // Para features premium, verificar se assinatura está ativa
        if (!this.isActive) {
            return false
        }
        
        return allFeatures.includes(feature)
    }

    /**
     * Rate limits generosos para usuários premium
     */
    getRateLimit(endpoint: string): RateLimit {
        const limits: Record<string, RateLimit> = {
            'POST /api/moments': { 
                requests: 100, 
                window: '1h',
                burst: 20  // 20x mais que free
            },
            'POST /api/users/follow': { 
                requests: 200, 
                window: '1h',
                burst: 50  // 20x mais que free
            },
            'GET /api/search': { 
                requests: 500, 
                window: '1h',
                burst: 100  // 25x mais que free
            },
            'GET /api/users': { 
                requests: 600, 
                window: '1h',
                burst: 150
            },
            'POST /api/moments/like': { 
                requests: 400, 
                window: '1h',
                burst: 80  // 20x mais que free
            },
            'POST /api/moments/comment': { 
                requests: 300, 
                window: '1h',
                burst: 60  // 20x mais que free
            },
            'POST /api/moments/:id/boost': { 
                requests: 50, 
                window: '1h',
                burst: 10
            },
            'GET /api/analytics': { 
                requests: 200, 
                window: '1h',
                burst: 40
            },
            'GET /api/export': { 
                requests: 10, 
                window: '24h',
                burst: 2
            },
            'default': { 
                requests: 1000, 
                window: '15m',
                burst: 200  // 10x mais que free
            }
        }
        
        return limits[endpoint] || limits.default
    }

    /**
     * Limites de armazenamento generosos para usuários premium
     */
    getStorageLimit(): StorageLimit {
        return {
            totalMB: 10000,                  // 10GB (100x mais que free)
            videoDurationMax: 3600,          // 1 hora máximo por vídeo (12x mais)
            imagesMax: 2000,                 // 2000 imagens máximo (40x mais)
            memoriesMax: -1,                 // Ilimitado
            momentsPerDay: 100,              // 100 posts por dia (20x mais)
            videoResolution: 'HD',           // Resolução HD
            imageQuality: 'high'             // Qualidade alta
        }
    }

    /**
     * Limites mensais generosos para usuários premium
     */
    getMonthlyLimits(): MonthlyLimits {
        return {
            posts: 3000,         // 100 por dia x 30 dias
            likes: 12000,        // 400 por dia x 30 dias
            comments: 3000,      // 100 por dia x 30 dias
            follows: 600,        // 20 por dia x 30 dias
            searches: 15000,     // 500 por dia x 30 dias
            profile_views: 6000, // 200 por dia x 30 dias
            boosts: 30           // 1 por dia x 30 dias
        }
    }

    /**
     * Usuários premium podem fazer qualquer tipo de boost
     */
    async canBoostMoment(type: BoostType): Promise<boolean> {
        // Verificar se assinatura está ativa
        if (!this.isActive) {
            return false
        }
        
        // Premium pode fazer todos os tipos de boost
        const allowedBoosts: BoostType[] = ['engagement', 'temporal', 'visibility']
        return allowedBoosts.includes(type)
    }

    /**
     * Prioridade máxima para usuários premium
     */
    getPriorityLevel(): number {
        return 5 // Prioridade máxima
    }

    // ==================== MÉTODOS ESPECÍFICOS PREMIUM ====================

    /**
     * Retorna boosts restantes no mês
     */
    async getBoostsRemaining(): Promise<number> {
        const usage = await this.getFeatureUsageStats('boosts')
        const limit = this.getMonthlyLimits().boosts
        return Math.max(0, (limit || 0) - usage.current)
    }

    /**
     * Verifica se pode usar analytics avançado
     */
    async canUseAdvancedAnalytics(): Promise<boolean> {
        return this.isActive && await this.canAccessFeature('analytics_advanced')
    }

    /**
     * Retorna tipos de boost disponíveis
     */
    getAvailableBoostTypes(): Array<{type: BoostType, name: string, description: string, multiplier: string, icon: string}> {
        return [
            {
                type: 'engagement',
                name: 'Boost de Engajamento',
                description: 'Aumenta likes, comentários e compartilhamentos',
                multiplier: '3x',
                icon: '❤️'
            },
            {
                type: 'temporal', 
                name: 'Boost de Prioridade',
                description: 'Seu momento aparece primeiro no feed',
                multiplier: '5x prioridade',
                icon: '⚡'
            },
            {
                type: 'visibility',
                name: 'Boost de Alcance',
                description: 'Mostra para muito mais pessoas',
                multiplier: '10x alcance',
                icon: '👁️'
            }
        ]
    }

    /**
     * Verifica se pode exportar dados
     */
    async canExportData(): Promise<boolean> {
        return this.isActive && await this.canAccessFeature('export_data')
    }

    /**
     * Retorna estatísticas premium disponíveis
     */
    async getPremiumAnalytics(): Promise<object> {
        if (!await this.canUseAdvancedAnalytics()) {
            throw new Error('Analytics avançado requer assinatura ativa')
        }

        // TODO: Implementar busca real de analytics
        return {
            profile_views: {
                total: 0,
                this_week: 0,
                growth: 0
            },
            post_performance: {
                average_likes: 0,
                average_comments: 0,
                best_performing_post: null
            },
            audience_insights: {
                top_interests: [],
                demographics: {},
                engagement_times: []
            },
            boost_statistics: {
                total_boosts_used: await this.getBoostsUsedThisMonth(),
                average_boost_performance: 0,
                best_boost_type: null
            }
        }
    }

    /**
     * Retorna benefícios premium ativos
     */
    getPremiumBenefits(): string[] {
        return [
            '🚀 30 boosts por mês',
            '📊 Analytics avançado',
            '🎨 Temas personalizados',
            '💾 10GB de armazenamento',
            '🎥 Vídeos HD até 1 hora',
            '🔍 Busca avançada',
            '⭐ Badge premium',
            '📈 Prioridade no feed',
            '💬 Suporte prioritário',
            '🎯 Sem anúncios',
            '📥 Exportar dados',
            '🏆 Perfil destacado'
        ]
    }

    /**
     * Verifica se uma feature é básica (disponível mesmo com assinatura expirada)
     */
    private isBasicFeature(feature: string): boolean {
        const basicFeatures = [
            'basic_posting', 'basic_search', 'basic_profile', 
            'follow_users', 'like_comments', 'view_moments', 'basic_notifications'
        ]
        return basicFeatures.includes(feature)
    }

    /**
     * Retorna boosts usados este mês
     */
    private async getBoostsUsedThisMonth(): Promise<number> {
        const usage = await this.getFeatureUsageStats('boosts')
        return usage.current
    }

    /**
     * Serializa dados específicos do usuário premium
     */
    toJSON(): object {
        return {
            ...super.toJSON(),
            user_type: 'premium',
            subscription: {
                status: this.subscriptionData?.status,
                expires_at: this.subscriptionExpiresAt,
                auto_renewing: this.subscriptionData?.auto_renewing,
                product_id: this.subscriptionData?.product_id
            },
            limits: {
                storage: this.getStorageLimit(),
                monthly: this.getMonthlyLimits(),
                rate_limits: {
                    posts_per_hour: this.getRateLimit('POST /api/moments').requests,
                    searches_per_hour: this.getRateLimit('GET /api/search').requests
                }
            },
            premium_benefits: this.getPremiumBenefits(),
            available_boost_types: this.getAvailableBoostTypes()
        }
    }
}
