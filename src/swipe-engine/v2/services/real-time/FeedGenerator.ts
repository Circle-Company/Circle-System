/**
 * FeedGenerator
 *
 * Responsável por gerar feeds de recomendações para usuários,
 * com cache e diversificação de conteúdo.
 */

import LRUCache from "lru-cache"
import { RecommendationEngine } from "../../core/recommendation/RecommendationEngine"
import { Recommendation, RecommendationOptions } from "../../core/types"
import { getLogger } from "../../core/utils/logger"

/**
 * Entrada de cache para o feed
 */
interface FeedCacheEntry {
    recommendations: Recommendation[]
    timestamp: number
    options?: RecommendationOptions
}

/**
 * Configuração para o gerador de feed
 */
export interface FeedGeneratorConfig {
    // Motor de recomendação
    recommendationEngine: RecommendationEngine | null

    // Tamanho padrão do feed
    defaultFeedSize: number

    // Tempo de vida do cache (ms)
    cacheTTL: number

    // Tamanho máximo do cache
    maxCacheSize: number
}

/**
 * Estatísticas do gerador de feed
 */
interface FeedGeneratorStats {
    cacheHits: number
    cacheMisses: number
    totalRequestsServed: number
    lastCacheCleanup: Date | null
    cacheSize: number
}

/**
 * Gerador de feeds de recomendação com cache
 */
export class FeedGenerator {
    private readonly logger = getLogger("FeedGenerator")
    private config: FeedGeneratorConfig
    private cache: LRUCache<string, FeedCacheEntry>
    private recommendationEngine: RecommendationEngine | null = null
    private stats: FeedGeneratorStats = {
        cacheHits: 0,
        cacheMisses: 0,
        totalRequestsServed: 0,
        lastCacheCleanup: null,
        cacheSize: 0,
    }

    /**
     * Construtor do gerador de feed
     * @param config Configuração para o gerador
     */
    constructor(config: FeedGeneratorConfig) {
        this.config = config
        this.recommendationEngine = config.recommendationEngine

        // Inicializar cache LRU
        this.cache = new LRUCache<string, FeedCacheEntry>({
            max: config.maxCacheSize,
            ttl: config.cacheTTL,
            updateAgeOnGet: true,
            updateAgeOnHas: false,
        })
    }

    /**
     * Gera um feed de recomendações para um usuário
     * @param userId ID do usuário
     * @param limit Número máximo de recomendações
     * @param options Opções adicionais
     * @returns Lista de recomendações
     */
    public async generateFeed(
        userId: string | bigint,
        limit: number = this.config.defaultFeedSize,
        options?: RecommendationOptions
    ): Promise<Recommendation[]> {
        this.stats.totalRequestsServed++
        const userIdString = String(userId)
        const cacheKey = this.getCacheKey(userIdString, limit, options)

        // Verificar se temos um feed em cache
        const cachedFeed = this.cache.get(cacheKey)
        if (cachedFeed && this.isCacheValid(cachedFeed, options)) {
            this.stats.cacheHits++
            this.logger.debug(`Cache hit para usuário ${userId}`)
            return cachedFeed.recommendations
        }

        this.stats.cacheMisses++
        this.logger.debug(`Cache miss para usuário ${userId}, gerando novas recomendações`)

        // Se não temos um motor de recomendação, retornar um array vazio
        if (!this.recommendationEngine) {
            this.logger.warn(`Motor de recomendação não disponível para usuário ${userId}`)
            return []
        }

        try {
            // Gerar novas recomendações
            const effectiveOptions: RecommendationOptions = {
                ...options,
                limit,
            }

            const recommendations = await this.recommendationEngine.getRecommendations(
                userId,
                limit,
                effectiveOptions
            )

            // Armazenar no cache
            this.cache.set(cacheKey, {
                recommendations,
                timestamp: Date.now(),
                options: effectiveOptions,
            })

            this.stats.cacheSize = this.cache.size
            return recommendations
        } catch (error: any) {
            this.logger.error(`Erro ao gerar feed para usuário ${userId}: ${error.message}`)
            return []
        }
    }

    /**
     * Invalida o cache para um usuário específico
     * @param userId ID do usuário
     */
    public invalidateCache(userId: string): void {
        const keysToDelete: string[] = []

        // Encontrar todas as chaves de cache para o usuário
        for (const key of this.cache.keys()) {
            if (key.startsWith(`user:${userId}:`)) {
                keysToDelete.push(key)
            }
        }

        // Remover entradas do cache
        keysToDelete.forEach((key) => {
            this.cache.delete(key)
        })

        this.stats.cacheSize = this.cache.size
        this.logger.debug(
            `Cache invalidado para usuário ${userId}, ${keysToDelete.length} entradas removidas`
        )
    }

    /**
     * Invalida todo o cache
     */
    public invalidateAllCache(): void {
        const size = this.cache.size
        this.cache.clear()
        this.stats.cacheSize = 0
        this.logger.info(`Cache completamente limpo, ${size} entradas removidas`)
    }

    /**
     * Limpa entradas expiradas do cache
     */
    public cleanupCache(): void {
        const sizeBefore = this.cache.size

        // Percorrer todas as entradas e remover as expiradas
        const keysToDelete: string[] = []
        const now = Date.now()

        for (const [key, entry] of this.cache.entries()) {
            if (now - (entry as FeedCacheEntry).timestamp > this.config.cacheTTL) {
                // @ts-ignore
                keysToDelete.push(key)
            }
        }

        keysToDelete.forEach((key) => {
            this.cache.delete(key)
        })

        this.stats.lastCacheCleanup = new Date()
        this.stats.cacheSize = this.cache.size

        this.logger.debug(
            `Limpeza de cache concluída, ${sizeBefore - this.cache.size} entradas removidas`
        )
    }

    /**
     * Retorna estatísticas do gerador de feed
     */
    public getStats(): FeedGeneratorStats {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
        }
    }

    /**
     * Gera uma chave de cache única
     * @param userId ID do usuário
     * @param limit Limite de recomendações
     * @param options Opções de recomendação
     * @returns Chave para o cache
     */
    private getCacheKey(userId: string, limit: number, options?: RecommendationOptions): string {
        // Formato básico: user:{userId}:limit:{limit}
        let key = `user:${userId}:limit:${limit}`

        // Adicionar opções relevantes para a chave
        if (options) {
            if (options.excludeIds) {
                key += `:excludeIds:${options.excludeIds.join(",")}`
            }

            if (options.diversity !== undefined) {
                key += `:diversity:${options.diversity}`
            }

            if (options.novelty !== undefined) {
                key += `:novelty:${options.novelty}`
            }

            if (options.context) {
                key += `:context:${JSON.stringify(options.context)}`
            }
        }

        return key
    }

    /**
     * Verifica se uma entrada de cache é válida considerando as opções
     * @param entry Entrada de cache
     * @param options Opções atuais
     * @returns True se o cache é válido
     */
    private isCacheValid(entry: FeedCacheEntry, options?: RecommendationOptions): boolean {
        // Verificar se a entrada expirou
        if (Date.now() - entry.timestamp > this.config.cacheTTL) {
            return false
        }

        // Se não houver opções atuais, o cache é válido
        if (!options) {
            return true
        }

        // Se não houver opções salvas no cache, o cache não é válido
        if (!entry.options) {
            return false
        }

        // Verificar se as opções críticas são as mesmas

        // 1. Verificar excludeIds
        if (options.excludeIds && entry.options.excludeIds) {
            const currentIds = new Set(options.excludeIds)
            const cachedIds = new Set(entry.options.excludeIds)

            // Se as opções atuais excluem mais IDs que não estavam nas opções originais
            // o cache não é válido
            for (const id of currentIds) {
                if (!cachedIds.has(id)) {
                    return false
                }
            }
        } else if (options.excludeIds && !entry.options.excludeIds) {
            return false
        }

        // 2. Verificar contexto
        if (
            options.context &&
            entry.options.context &&
            JSON.stringify(options.context) !== JSON.stringify(entry.options.context)
        ) {
            return false
        }

        return true
    }
}
