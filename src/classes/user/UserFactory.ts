import { BaseUser } from "./baseUser"
import { FreeUser } from "./freeUser"
import { PremiumUser } from "./premiumUser"
import { UserData, UserSubscription } from "../../services/user-service/types"
import User from "../../models/user/user-model"
import Statistic from "../../models/user/statistic-model"

/**
 * Factory para criar instâncias de usuários baseado no tier da assinatura
 * Implementa cache em memória para performance
 */
export class UserFactory {
    private static userCache = new Map<bigint, BaseUser>()
    private static cacheTimeout = 5 * 60 * 1000 // 5 minutos

    /**
     * Cria uma instância de usuário baseada no tier da assinatura
     */
    static async createUser(userId: bigint): Promise<BaseUser> {
        try {
            // Verificar cache primeiro
            const cached = this.userCache.get(userId)
            if (cached) {
                return cached
            }

            // Carregar dados do usuário
            const userData = await this.loadUserData(userId)
            let user: BaseUser

            if (userData.subscription_tier === 'premium') {
                // Carregar dados da assinatura para Premium
                const subscriptionData = await this.loadSubscriptionData(userId)
                user = new PremiumUser(userData, subscriptionData || undefined)
            } else {
                // Free user (padrão)
                user = new FreeUser(userData)
            }

            // Cache o usuário com timeout
            this.cacheUser(userId, user)

            return user
        } catch (error) {
            console.error(`Error creating user ${userId}:`, error)
            throw error
        }
    }

    /**
     * Cria usuário a partir de dados já carregados (útil para otimização)
     */
    static createUserFromData(userData: UserData, subscriptionData?: UserSubscription): BaseUser {
        if (userData.subscription_tier === 'premium') {
            return new PremiumUser(userData, subscriptionData)
        } else {
            return new FreeUser(userData)
        }
    }

    /**
     * Carrega dados básicos do usuário do banco de dados
     */
    private static async loadUserData(userId: bigint): Promise<UserData> {
        const user = await (User as any).findOne({
            where: { id: userId },
            include: [
                { 
                    model: Statistic, 
                    as: 'statistics',
                    required: false // LEFT JOIN para não falhar se não existir
                }
            ]
        })
        
        if (!user) {
            throw new Error('User not found')
        }

        // Garantir que subscription_tier existe (para usuários antigos)
        const subscriptionTier = (user as any).subscription_tier || 'free'
        
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            email: (user as any).email || null,
            subscription_tier: subscriptionTier,
            verifyed: user.verifyed || false,
            blocked: user.blocked || false,
            deleted: user.deleted || false,
            muted: user.muted || false,
            access_level: user.access_level || 0,
            description: user.description,
            send_notification_emails: user.send_notification_emails,
            created_at: user.created_at,
            updated_at: user.updated_at,
            // Dados relacionados
            statistics: user.statistics || null,
            preferences: null
        }
    }

    /**
     * Carrega dados da assinatura premium do usuário
     */
    private static async loadSubscriptionData(userId: bigint): Promise<UserSubscription | null> {
        try {
            // TODO: Implementar modelo UserSubscription
            // Por enquanto retorna null, mas deveria buscar na tabela user_subscriptions
            
            // const subscription = await UserSubscription.findOne({
            //     where: { 
            //         user_id: userId,
            //         status: ['active', 'paused'] // Apenas assinaturas válidas
            //     },
            //     order: [['created_at', 'DESC']] // Mais recente primeiro
            // })
            
            // return subscription
            
            return null
        } catch (error) {
            console.error(`Error loading subscription for user ${userId}:`, error)
            return null
        }
    }

    /**
     * Adiciona usuário ao cache com timeout automático
     */
    private static cacheUser(userId: bigint, user: BaseUser): void {
        this.userCache.set(userId, user)
        
        // Remover do cache após timeout
        setTimeout(() => {
            this.userCache.delete(userId)
        }, this.cacheTimeout)
    }

    /**
     * Remove usuário específico do cache
     */
    static clearCache(userId?: bigint): void {
        if (userId) {
            this.userCache.delete(userId)
        } else {
            // Limpar todo o cache
            this.userCache.clear()
        }
    }

    /**
     * Retorna estatísticas do cache
     */
    static getCacheStats(): {size: number, timeout: number} {
        return {
            size: this.userCache.size,
            timeout: this.cacheTimeout
        }
    }

    /**
     * Atualiza o timeout do cache
     */
    static setCacheTimeout(timeoutMs: number): void {
        this.cacheTimeout = timeoutMs
    }

    /**
     * Verifica se usuário está no cache
     */
    static isUserCached(userId: bigint): boolean {
        return this.userCache.has(userId)
    }

    /**
     * Força recarga de um usuário (limpa cache e recarrega)
     */
    static async reloadUser(userId: bigint): Promise<BaseUser> {
        this.clearCache(userId)
        return await this.createUser(userId)
    }

    /**
     * Cria múltiplos usuários de forma otimizada
     */
    static async createMultipleUsers(userIds: bigint[]): Promise<Map<bigint, BaseUser>> {
        const results = new Map<bigint, BaseUser>()
        
        // Separar IDs que já estão no cache
        const cachedIds = userIds.filter(id => this.userCache.has(id))
        const uncachedIds = userIds.filter(id => !this.userCache.has(id))
        
        // Adicionar usuários do cache
        cachedIds.forEach(id => {
            const user = this.userCache.get(id)!
            results.set(id, user)
        })
        
        // Carregar usuários não cachados em paralelo
        if (uncachedIds.length > 0) {
            const userPromises = uncachedIds.map(id => this.createUser(id))
            const users = await Promise.allSettled(userPromises)
            
            users.forEach((result, index) => {
                const userId = uncachedIds[index]
                if (result.status === 'fulfilled') {
                    results.set(userId, result.value)
                } else {
                    console.error(`Failed to load user ${userId}:`, result.reason)
                }
            })
        }
        
        return results
    }

    /**
     * Método de conveniência para buscar usuário com fallback
     */
    static async createUserSafe(userId: bigint): Promise<BaseUser | null> {
        try {
            return await this.createUser(userId)
        } catch (error) {
            console.error(`Failed to create user ${userId}:`, error)
            return null
        }
    }

    /**
     * Pré-aquece o cache com usuários mais ativos
     */
    static async warmUpCache(activeUserIds: bigint[]): Promise<void> {
        try {
            console.log(`Warming up cache with ${activeUserIds.length} users...`)
            await this.createMultipleUsers(activeUserIds)
            console.log('Cache warm-up completed')
        } catch (error) {
            console.error('Cache warm-up failed:', error)
        }
    }
}
