import { 
    UserData, 
    UserSubscription, 
    FeatureUsage, 
    FeatureUsageStats, 
    RateLimit, 
    StorageLimit, 
    MonthlyLimits, 
    BoostType, 
    SubscriptionTier 
} from "../../services/user-service/types"

/**
 * Classe abstrata base para todos os tipos de usuário
 * Define a interface comum e métodos compartilhados
 */
export abstract class BaseUser {
    protected userData: UserData
    protected subscriptionData?: UserSubscription
    protected featureUsage: Map<string, FeatureUsage>

    constructor(userData: UserData, subscriptionData?: UserSubscription) {
        this.userData = userData
        this.subscriptionData = subscriptionData
        this.featureUsage = new Map()
        this.loadFeatureUsage()
    }

    // ==================== MÉTODOS ABSTRATOS ====================
    // Devem ser implementados por cada subclasse

    /**
     * Verifica se o usuário pode acessar uma feature específica
     */
    abstract canAccessFeature(feature: string): Promise<boolean>

    /**
     * Retorna os limites de rate limiting para um endpoint específico
     */
    abstract getRateLimit(endpoint: string): RateLimit

    /**
     * Retorna os limites de armazenamento do usuário
     */
    abstract getStorageLimit(): StorageLimit

    /**
     * Retorna os limites mensais de uso
     */
    abstract getMonthlyLimits(): MonthlyLimits

    /**
     * Retorna o tipo do usuário (free, premium)
     */
    abstract getUserType(): string

    /**
     * Verifica se pode fazer boost de um tipo específico
     */
    abstract canBoostMoment(type: BoostType): Promise<boolean>

    /**
     * Retorna o nível de prioridade do usuário (1=baixa, 5=alta)
     */
    abstract getPriorityLevel(): number

    // ==================== MÉTODOS CONCRETOS COMPARTILHADOS ====================

    /**
     * Rastreia o uso de uma feature específica
     */
    async trackFeatureUsage(feature: string): Promise<void> {
        // Importação dinâmica para evitar dependência circular
        const { FeatureUsageService } = await import("../plans/FeatureUsageService")
        await FeatureUsageService.track(this.userData.id, feature)
        
        // Atualizar cache local
        const usage = await FeatureUsageService.getUsage(this.userData.id, feature)
        this.featureUsage.set(feature, usage)
    }

    /**
     * Verifica se está dentro do limite de uso de uma feature
     */
    async isWithinUsageLimit(feature: string): Promise<boolean> {
        const usage = await this.getFeatureUsageStats(feature)
        const limit = this.getFeatureLimit(feature)
        
        if (limit === -1) return true // Ilimitado
        return usage.current < limit
    }

    /**
     * Retorna estatísticas de uso de uma feature
     */
    async getFeatureUsageStats(feature: string): Promise<FeatureUsageStats> {
        const { FeatureUsageService } = await import("../plans/FeatureUsageService")
        return await FeatureUsageService.getStats(this.userData.id, feature)
    }

    /**
     * Retorna o uso restante de uma feature
     */
    async getRemainingUsage(feature: string): Promise<number> {
        const usage = await this.getFeatureUsageStats(feature)
        const limit = this.getFeatureLimit(feature)
        
        if (limit === -1) return -1 // Ilimitado
        return Math.max(0, limit - usage.current)
    }

    /**
     * Verifica se a assinatura premium está ativa
     */
    isSubscriptionActive(): boolean {
        if (this.userData.subscription_tier === 'free') return true
        
        if (!this.subscriptionData) return false
        
        // Verificar se não está expirada
        if (this.subscriptionData.expires_at && this.subscriptionData.expires_at <= new Date()) {
            return false
        }
        
        // Verificar status
        const activeStatuses = ['active', 'trialing']
        return activeStatuses.includes(this.subscriptionData.status)
    }

    /**
     * Retorna lista de features disponíveis para este usuário
     */
    async getAvailableFeatures(): Promise<string[]> {
        const allFeatures = this.getAllPossibleFeatures()
        const availableFeatures: string[] = []
        
        for (const feature of allFeatures) {
            if (await this.canAccessFeature(feature)) {
                availableFeatures.push(feature)
            }
        }
        
        return availableFeatures
    }

    /**
     * Retorna todas as features possíveis no sistema (método público)
     */
    public getAllFeatures(): string[] {
        return this.getAllPossibleFeatures()
    }

    /**
     * Retorna estatísticas de uso geral do usuário
     */
    async getUsageStats(): Promise<Record<string, FeatureUsageStats>> {
        const features = await this.getAvailableFeatures()
        const stats: Record<string, FeatureUsageStats> = {}
        
        for (const feature of features) {
            if (this.hasUsageLimit(feature)) {
                stats[feature] = await this.getFeatureUsageStats(feature)
            }
        }
        
        return stats
    }

    // ==================== MÉTODOS PROTEGIDOS ====================

    /**
     * Carrega dados de uso de features do cache/database
     */
    protected async loadFeatureUsage(): Promise<void> {
        // Este método pode ser sobrescrito por subclasses se necessário
        // Por padrão, não carrega nada no construtor para evitar async
    }

    /**
     * Retorna o limite de uma feature específica
     */
    protected getFeatureLimit(feature: string): number {
        const limits = this.getMonthlyLimits()
        
        switch (feature) {
            case 'posts':
                return limits.posts
            case 'likes':
                return limits.likes
            case 'comments':
                return limits.comments
            case 'follows':
                return limits.follows
            case 'searches':
                return limits.searches
            case 'profile_views':
                return limits.profile_views
            case 'boosts':
                return limits.boosts || 0
            default:
                return -1 // Ilimitado por padrão
        }
    }

    /**
     * Verifica se uma feature tem limite de uso
     */
    protected hasUsageLimit(feature: string): boolean {
        return this.getFeatureLimit(feature) !== -1
    }

    /**
     * Retorna todas as features possíveis do sistema
     */
    protected getAllPossibleFeatures(): string[] {
        return [
            // Features básicas
            'basic_posting',
            'basic_search', 
            'basic_profile',
            'follow_users',
            'like_comments',
            'view_moments',
            'basic_notifications',
            
            // Features premium
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
    }

    // ==================== GETTERS PÚBLICOS ====================

    get id(): bigint { 
        return this.userData.id 
    }

    get username(): string { 
        return this.userData.username 
    }

    get name(): string | null { 
        return this.userData.name || null 
    }

    get email(): string | null { 
        return this.userData.email || null 
    }

    get subscriptionTier(): SubscriptionTier { 
        return this.userData.subscription_tier 
    }

    get isActive(): boolean { 
        return this.isSubscriptionActive()
    }

    get subscriptionExpiresAt(): Date | null { 
        return this.subscriptionData?.expires_at || null 
    }

    get isVerified(): boolean {
        return this.userData.verifyed || false
    }

    get isBlocked(): boolean {
        return this.userData.blocked || false
    }

    get isDeleted(): boolean {
        return this.userData.deleted || false
    }

    get isMuted(): boolean {
        return this.userData.muted || false
    }

    get accessLevel(): number {
        return this.userData.access_level || 0
    }

    /**
     * Serializa os dados básicos do usuário para resposta da API
     */
    toJSON(): object {
        return {
            id: this.id,
            username: this.username,
            name: this.name,
            subscription_tier: this.subscriptionTier,
            is_active: this.isActive,
            subscription_expires_at: this.subscriptionExpiresAt,
            is_verified: this.isVerified,
            priority_level: this.getPriorityLevel()
        }
    }
}
