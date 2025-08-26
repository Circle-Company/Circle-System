import { FeatureUsage, FeatureUsageStats } from "../../services/user-service/types"

/**
 * Serviço para gerenciar uso de features pelos usuários
 * Rastreia limites diários, mensais e anuais
 */
export class FeatureUsageService {
    // Storage em memória para testes
    private static memoryStorage = new Map<string, { count: number, lastUsedAt: Date, lastResetAt: Date }>()
    
    /**
     * Rastreia o uso de uma feature específica
     */
    static async track(userId: bigint, feature: string): Promise<void> {
        try {
            // TODO: Implementar com modelo PremiumFeatureUsage
            // Por enquanto apenas log, mas deveria:
            // 1. Buscar ou criar registro de uso
            // 2. Incrementar contador
            // 3. Atualizar last_used_at
            // 4. Verificar se precisa resetar baseado no período

            // Implementação simples em memória para testes
            const key = `${userId}-${feature}`
            const now = new Date()
            
            const existing = this.memoryStorage.get(key) || {
                count: 0,
                lastUsedAt: now,
                lastResetAt: now
            }
            
            // Verificar se precisa resetar baseado no período
            const resetPeriod = this.getResetPeriod(feature)
            if (this.shouldResetByPeriod(existing.lastResetAt, resetPeriod)) {
                existing.count = 0
                existing.lastResetAt = now
            }
            
            existing.count++
            existing.lastUsedAt = now
            
            this.memoryStorage.set(key, existing)
            
            console.log(`Feature usage tracked: ${feature} for user ${userId} (count: ${existing.count})`)
            
            /*
            const now = new Date()
            
            // Buscar ou criar registro
            const [usage] = await PremiumFeatureUsage.findOrCreate({
                where: {
                    user_id: userId,
                    feature_name: feature
                },
                defaults: {
                    user_id: userId,
                    feature_name: feature,
                    usage_count: 0,
                    reset_period: this.getResetPeriod(feature),
                    last_reset_at: now
                }
            })

            // Verificar se precisa resetar
            if (this.shouldReset(usage)) {
                await usage.update({
                    usage_count: 1,
                    last_used_at: now,
                    last_reset_at: now
                })
            } else {
                await usage.update({
                    usage_count: usage.usage_count + 1,
                    last_used_at: now
                })
            }
            */
        } catch (error) {
            console.error(`Error tracking feature usage: ${error}`)
            // Não lançar erro para não quebrar o fluxo principal
        }
    }

    /**
     * Retorna o uso atual de uma feature
     */
    static async getUsage(userId: bigint, feature: string): Promise<FeatureUsage> {
        try {
            // Buscar no storage em memória
            const key = `${userId}-${feature}`
            const stored = this.memoryStorage.get(key)
            
            if (!stored) {
                return {
                    count: 0,
                    lastUsedAt: null,
                    resetPeriod: this.getResetPeriod(feature),
                    lastResetAt: new Date()
                }
            }
            
            return {
                count: stored.count,
                lastUsedAt: stored.lastUsedAt,
                resetPeriod: this.getResetPeriod(feature),
                lastResetAt: stored.lastResetAt
            }
            
            /*
            const usage = await PremiumFeatureUsage.findOne({
                where: {
                    user_id: userId,
                    feature_name: feature
                }
            })

            if (!usage) {
                return {
                    count: 0,
                    lastUsedAt: null,
                    resetPeriod: this.getResetPeriod(feature),
                    lastResetAt: new Date()
                }
            }

            // Verificar se precisa resetar
            if (this.shouldReset(usage)) {
                await usage.update({
                    usage_count: 0,
                    last_reset_at: new Date()
                })
                
                return {
                    count: 0,
                    lastUsedAt: usage.last_used_at,
                    resetPeriod: usage.reset_period,
                    lastResetAt: new Date()
                }
            }

            return {
                count: usage.usage_count,
                lastUsedAt: usage.last_used_at,
                resetPeriod: usage.reset_period,
                lastResetAt: usage.last_reset_at
            }
            */

            return {
                count: 0,
                lastUsedAt: null,
                resetPeriod: this.getResetPeriod(feature),
                lastResetAt: new Date()
            }
        } catch (error) {
            console.error(`Error getting feature usage: ${error}`)
            return {
                count: 0,
                lastUsedAt: null,
                resetPeriod: this.getResetPeriod(feature),
                lastResetAt: new Date()
            }
        }
    }

    /**
     * Retorna estatísticas detalhadas de uso
     */
    static async getStats(userId: bigint, feature: string): Promise<FeatureUsageStats> {
        try {
            const usage = await this.getUsage(userId, feature)
            const nextReset = this.calculateNextReset(usage.lastResetAt, usage.resetPeriod)
            const limit = this.getDefaultLimit(feature)
            const percentage = limit === -1 ? 0 : (usage.count / limit) * 100
            
            return {
                current: usage.count,
                limit: limit,
                resetPeriod: usage.resetPeriod,
                lastUsedAt: usage.lastUsedAt,
                resetDate: nextReset,
                percentage: Math.min(100, Math.max(0, percentage))
            }
        } catch (error) {
            console.error(`Error getting feature stats: ${error}`)
            return {
                current: 0,
                limit: 100,
                resetPeriod: this.getResetPeriod(feature),
                lastUsedAt: null,
                resetDate: new Date(),
                percentage: 0
            }
        }
    }

    /**
     * Determina o período de reset baseado na feature
     */
    private static getResetPeriod(feature: string): 'daily' | 'weekly' | 'monthly' | 'yearly' {
        const dailyFeatures = ['daily_posts', 'posts_daily']
        const weeklyFeatures = ['weekly_posts']
        const yearlyFeatures = ['export_data']
        
        if (dailyFeatures.includes(feature)) {
            return 'daily'
        }
        
        if (weeklyFeatures.includes(feature)) {
            return 'weekly'
        }
        
        if (yearlyFeatures.includes(feature)) {
            return 'yearly'
        }
        
        return 'monthly' // Padrão
    }

    /**
     * Retorna limite padrão para uma feature
     */
    private static getDefaultLimit(feature: string): number {
        const limits: Record<string, number> = {
            posts: 100,
            likes: 500,
            comments: 100,
            searches: 50,
            boosts: 10,
            profile_views: 30,
            follows: 20,
            daily_posts: 5,
            weekly_posts: 25,
            unknown_feature: -1 // Unlimited
        }
        
        return limits[feature] ?? 100
    }

    /**
     * Verifica se deve resetar baseado no período (para memory storage)
     */
    private static shouldResetByPeriod(lastResetAt: Date, resetPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly'): boolean {
        const now = new Date()
        const lastReset = new Date(lastResetAt)
        
        switch (resetPeriod) {
            case 'daily':
                return now.getDate() !== lastReset.getDate() ||
                       now.getMonth() !== lastReset.getMonth() ||
                       now.getFullYear() !== lastReset.getFullYear()
            case 'weekly':
                const daysDiff = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24))
                return daysDiff >= 7
            case 'monthly':
                return now.getMonth() !== lastReset.getMonth() ||
                       now.getFullYear() !== lastReset.getFullYear()
            case 'yearly':
                return now.getFullYear() !== lastReset.getFullYear()
            default:
                return false
        }
    }

    /**
     * Verifica se deve resetar o contador baseado no período
     */
    private static shouldReset(usage: any): boolean {
        if (!usage.last_reset_at) return true
        
        const now = new Date()
        const lastReset = new Date(usage.last_reset_at)
        
        switch (usage.reset_period) {
            case 'daily':
                return now.getDate() !== lastReset.getDate() ||
                       now.getMonth() !== lastReset.getMonth() ||
                       now.getFullYear() !== lastReset.getFullYear()
                       
            case 'monthly':
                return now.getMonth() !== lastReset.getMonth() ||
                       now.getFullYear() !== lastReset.getFullYear()
                       
            case 'yearly':
                return now.getFullYear() !== lastReset.getFullYear()
                
            default:
                return false
        }
    }

    /**
     * Calcula a próxima data de reset
     */
    private static calculateNextReset(lastReset: Date, period: 'daily' | 'monthly' | 'yearly'): Date {
        const nextReset = new Date(lastReset)
        
        switch (period) {
            case 'daily':
                nextReset.setDate(nextReset.getDate() + 1)
                nextReset.setHours(0, 0, 0, 0)
                break
                
            case 'monthly':
                nextReset.setMonth(nextReset.getMonth() + 1)
                nextReset.setDate(1)
                nextReset.setHours(0, 0, 0, 0)
                break
                
            case 'yearly':
                nextReset.setFullYear(nextReset.getFullYear() + 1)
                nextReset.setMonth(0)
                nextReset.setDate(1)
                nextReset.setHours(0, 0, 0, 0)
                break
        }
        
        return nextReset
    }

    /**
     * Reseta manually o uso de uma feature (útil para testes ou admin)
     */
    static async resetUsage(userId: bigint, feature?: string): Promise<void> {
        try {
            if (feature) {
                // Reset específico
                const key = `${userId}-${feature}`
                const stored = this.memoryStorage.get(key)
                if (stored) {
                    stored.count = 0
                    stored.lastResetAt = new Date()
                    this.memoryStorage.set(key, stored)
                }
                console.log(`Feature usage reset: ${feature} for user ${userId}`)
            } else {
                // Reset todas as features do usuário
                const userPrefix = `${userId}-`
                const keysToReset = Array.from(this.memoryStorage.keys()).filter(key => key.startsWith(userPrefix))
                
                for (const key of keysToReset) {
                    const stored = this.memoryStorage.get(key)!
                    stored.count = 0
                    stored.lastResetAt = new Date()
                    this.memoryStorage.set(key, stored)
                }
                console.log(`All feature usage reset for user ${userId}`)
            }
            
            /*
            if (feature) {
                await PremiumFeatureUsage.update({
                    usage_count: 0,
                    last_reset_at: new Date()
                }, {
                    where: {
                        user_id: userId,
                        feature_name: feature
                    }
                })
            } else {
                await PremiumFeatureUsage.update({
                    usage_count: 0,
                    last_reset_at: new Date()
                }, {
                    where: {
                        user_id: userId
                    }
                })
            }
            */
        } catch (error) {
            console.error(`Error resetting feature usage: ${error}`)
            throw error
        }
    }

    /**
     * Retorna todas as features com uso ativo para um usuário
     */
    static async getAllUsage(userId: bigint): Promise<Array<FeatureUsage & { feature: string }>> {
        try {
            // TODO: Implementar busca real
            const usageArray: Array<FeatureUsage & { feature: string }> = []
            
            /*
            const usages = await PremiumFeatureUsage.findAll({
                where: { user_id: userId }
            })

            for (const usage of usages) {
                const featureUsage = await this.getUsage(userId, usage.feature_name)
                usageArray.push({
                    ...featureUsage,
                    feature: usage.feature_name
                })
            }
            */
            
            return usageArray
        } catch (error) {
            console.error(`Error getting all usage: ${error}`)
            return []
        }
    }

    /**
     * Executa limpeza de registros antigos (job de manutenção)
     */
    static async cleanupOldUsage(): Promise<void> {
        try {
            // TODO: Implementar limpeza real
            // Remover registros muito antigos (ex: mais de 1 ano)
            console.log('Cleanup old usage records')
            
            /*
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
            
            await PremiumFeatureUsage.destroy({
                where: {
                    last_used_at: {
                        [Op.lt]: oneYearAgo
                    }
                }
            })
            */
        } catch (error) {
            console.error(`Error during cleanup: ${error}`)
        }
    }
}
