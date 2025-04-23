/**
 * PostRanker
 *
 * Serviço responsável por ranquear posts para exibição no feed do usuário,
 * considerando relevância, engajamento e outros fatores.
 */

import { cosineSimilarity } from "../../../core/utils/vector-operations"
import { UserPreferenceService } from "../../users/preferences/UserPreferenceService"
import { PersonalizedScoreCalculator } from "./PersonalizedScoreCalculator"

// Interface para posts a serem ranqueados
export interface PostCandidate {
    id: bigint | string
    createdAt: Date
    authorId: bigint
    embedding?: number[]
    topics?: string[]
    contentType?: string
    engagementMetrics?: {
        views: number
        likes: number
        comments: number
        shares: number
    }
}

// Interface para repositório de posts
export interface IPostRepository {
    getCandidatePosts(options: {
        limit?: number
        excludeIds?: (bigint | string)[]
        afterTimestamp?: Date
    }): Promise<PostCandidate[]>
    getPostsByIds(ids: (bigint | string)[]): Promise<PostCandidate[]>
    getPostsByAuthorIds(authorIds: bigint[]): Promise<PostCandidate[]>
}

// Interface para repositório de embeddings
export interface IEmbeddingRepository {
    getUserEmbedding(userId: bigint): Promise<number[] | null>
    getPostEmbedding(postId: bigint | string): Promise<number[] | null>
}

// Resultado do ranqueamento
export interface RankedPost extends PostCandidate {
    score: number
    relevanceScore: number
    recencyScore: number
    engagementScore: number
    authorScore: number
}

// Configuração do ranqueamento
export interface RankingConfig {
    weights: {
        relevance: number
        recency: number
        engagement: number
        authorAffinity: number
    }
    decayFactor: number // Fator de decaimento temporal
    timeUnit: number // Unidade de tempo em milissegundos
    maxAge: number // Idade máxima em unidades de tempo
    diversityFactor: number // 0-1, quanto maior mais diversidade
}

export class PostRanker {
    private postRepository: IPostRepository
    private embeddingRepository: IEmbeddingRepository
    private userPreferenceService: UserPreferenceService
    private personalizedScoreCalculator: PersonalizedScoreCalculator
    private defaultConfig: RankingConfig

    constructor(
        postRepository: IPostRepository,
        embeddingRepository: IEmbeddingRepository,
        userPreferenceService: UserPreferenceService,
        personalizedScoreCalculator: PersonalizedScoreCalculator,
        config?: Partial<RankingConfig>
    ) {
        this.postRepository = postRepository
        this.embeddingRepository = embeddingRepository
        this.userPreferenceService = userPreferenceService
        this.personalizedScoreCalculator = personalizedScoreCalculator

        // Configuração padrão
        this.defaultConfig = {
            weights: {
                relevance: 0.5,
                recency: 0.2,
                engagement: 0.2,
                authorAffinity: 0.1,
            },
            decayFactor: 0.05,
            timeUnit: 60 * 60 * 1000, // 1 hora em milissegundos
            maxAge: 48, // 48 horas
            diversityFactor: 0.3,
            ...config,
        }
    }

    /**
     * Ranqueia posts para o feed de um usuário específico
     *
     * @param userId ID do usuário
     * @param options Opções de ranqueamento
     * @returns Lista de posts ranqueados
     */
    public async rankPostsForUser(
        userId: bigint,
        options: {
            limit?: number
            excludeIds?: (bigint | string)[]
            config?: Partial<RankingConfig>
        } = {}
    ): Promise<RankedPost[]> {
        try {
            const config = { ...this.defaultConfig, ...options.config }
            const limit = options.limit || 50

            // 1. Obter candidatos
            const candidates = await this.postRepository.getCandidatePosts({
                limit: limit * 3, // Buscar mais posts para ter margem para diversidade
                excludeIds: options.excludeIds,
                afterTimestamp: this.getMaxAgeTimestamp(config),
            })

            if (candidates.length === 0) {
                return []
            }

            // 2. Obter embedding do usuário
            const userEmbedding = await this.embeddingRepository.getUserEmbedding(userId)

            // 3. Obter preferências do usuário
            const userPreferences = await this.userPreferenceService.getUserPreferences(userId)

            // 4. Calcular scores para cada post
            const rankedPosts: RankedPost[] = await Promise.all(
                candidates.map(async (post) => {
                    // Buscar embedding do post, se não estiver já disponível
                    const postEmbedding =
                        post.embedding || (await this.embeddingRepository.getPostEmbedding(post.id))

                    // Calcular scores individuais
                    const relevanceScore = await this.calculateRelevanceScore(
                        userEmbedding,
                        postEmbedding,
                        post,
                        userPreferences
                    )

                    const recencyScore = this.calculateRecencyScore(post.createdAt, config)
                    const engagementScore = this.calculateEngagementScore(post)
                    const authorScore = await this.calculateAuthorAffinityScore(
                        userId,
                        post.authorId
                    )

                    // Calcular score composto
                    const score =
                        relevanceScore * config.weights.relevance +
                        recencyScore * config.weights.recency +
                        engagementScore * config.weights.engagement +
                        authorScore * config.weights.authorAffinity

                    return {
                        ...post,
                        score,
                        relevanceScore,
                        recencyScore,
                        engagementScore,
                        authorScore,
                    }
                })
            )

            // 5. Ordenar por score
            const sortedPosts = rankedPosts.sort((a, b) => b.score - a.score)

            // 6. Aplicar diversidade, se necessário
            return this.applyDiversity(sortedPosts, config.diversityFactor, limit)
        } catch (error: any) {
            console.error(`Erro ao ranquear posts para usuário ${userId}: ${error.message}`)
            return []
        }
    }

    /**
     * Calcula o score de relevância entre um usuário e um post
     */
    private async calculateRelevanceScore(
        userEmbedding: number[] | null,
        postEmbedding: number[] | null,
        post: PostCandidate,
        userPreferences: any
    ): Promise<number> {
        // Se temos ambos os embeddings, usar similaridade de cosseno
        if (userEmbedding && postEmbedding) {
            return cosineSimilarity(userEmbedding, postEmbedding)
        }

        // Caso contrário, calcular score baseado em tópicos
        const score = await this.personalizedScoreCalculator.calculateTopicBasedScore(
            userPreferences,
            post
        )

        return score
    }

    /**
     * Calcula o score de recência de um post
     */
    private calculateRecencyScore(createdAt: Date, config: RankingConfig): number {
        const age = (Date.now() - createdAt.getTime()) / config.timeUnit
        if (age > config.maxAge) return 0

        // Decaimento exponencial
        return Math.exp(-config.decayFactor * age)
    }

    /**
     * Calcula o score de engajamento de um post
     */
    private calculateEngagementScore(post: PostCandidate): number {
        if (!post.engagementMetrics) return 0.5 // Valor neutro se não temos métricas

        const { views, likes, comments, shares } = post.engagementMetrics

        // Fórmula simples ponderando diferentes tipos de engajamento
        const engagementScore = (views * 0.1 + likes * 0.3 + comments * 0.4 + shares * 0.5) / 100 // Normalizar

        // Limitar para o intervalo [0, 1]
        return Math.min(1, Math.max(0, engagementScore))
    }

    /**
     * Calcula a afinidade do usuário com o autor do post
     */
    private async calculateAuthorAffinityScore(userId: bigint, authorId: bigint): Promise<number> {
        // Implementação simplificada
        if (userId === authorId) return 1.0 // Máxima afinidade com próprio conteúdo

        // Aqui poderia ser implementada uma lógica mais sofisticada
        // baseada no histórico de interações entre o usuário e o autor

        return 0.5 // Valor neutro por padrão
    }

    /**
     * Aplica diversidade à lista de posts
     */
    private applyDiversity(
        posts: RankedPost[],
        diversityFactor: number,
        limit: number
    ): RankedPost[] {
        if (diversityFactor <= 0 || posts.length <= limit) {
            return posts.slice(0, limit)
        }

        // Conjunto de tópicos já incluídos
        const includedTopics = new Set<string>()
        const result: RankedPost[] = []

        // Dividir entre top posts e posts para diversidade
        const topCount = Math.floor(limit * (1 - diversityFactor))

        // Adicionar top posts
        for (let i = 0; i < Math.min(topCount, posts.length); i++) {
            result.push(posts[i])

            // Registrar tópicos
            if (posts[i].topics) {
                // @ts-ignore
                posts[i].topics.forEach((topic) => includedTopics.add(topic))
            }
        }

        // Adicionar posts para diversidade
        let i = topCount
        while (result.length < limit && i < posts.length) {
            const post = posts[i]

            // Verificar diversidade
            const hasUniqueTopics = post.topics?.some((topic) => !includedTopics.has(topic))

            if (hasUniqueTopics || Math.random() < 0.3) {
                // Chance aleatória para diversidade
                result.push(post)

                // Registrar tópicos
                if (post.topics) {
                    post.topics.forEach((topic) => includedTopics.add(topic))
                }
            }

            i++
        }

        // Se ainda não preenchemos o limite, adicionar os próximos melhores
        if (result.length < limit) {
            let i = 0
            while (result.length < limit && i < posts.length) {
                if (!result.includes(posts[i])) {
                    result.push(posts[i])
                }
                i++
            }
        }

        return result
    }

    /**
     * Retorna o timestamp máximo para a idade configurada
     */
    private getMaxAgeTimestamp(config: RankingConfig): Date {
        const maxAgeMs = config.maxAge * config.timeUnit
        return new Date(Date.now() - maxAgeMs)
    }
}
