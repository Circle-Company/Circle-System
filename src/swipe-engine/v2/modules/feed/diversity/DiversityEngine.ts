/**
 * DiversityEngine
 *
 * Motor de diversidade que garante que o feed do usuário apresente
 * uma variedade adequada de conteúdo, tópicos e formatos.
 */

import { RankedPost } from "../ranking/PostRanker"

// Configuração para o motor de diversidade
export interface DiversityConfig {
    topicDiversityWeight: number // 0-1, peso para diversidade de tópicos
    authorDiversityWeight: number // 0-1, peso para diversidade de autores
    contentTypeDiversityWeight: number // 0-1, peso para diversidade de tipos de conteúdo
    timeFrameDiversityWeight: number // 0-1, peso para distribuição temporal
    maxConsecutiveSimilarTopics: number // Máximo de posts consecutivos com tópicos similares
    maxConsecutiveSameAuthor: number // Máximo de posts consecutivos do mesmo autor
    maxConsecutiveSameContentType: number // Máximo de posts consecutivos do mesmo tipo
}

export class DiversityEngine {
    private defaultConfig: DiversityConfig

    constructor(config?: Partial<DiversityConfig>) {
        // Configuração padrão
        this.defaultConfig = {
            topicDiversityWeight: 0.4,
            authorDiversityWeight: 0.3,
            contentTypeDiversityWeight: 0.2,
            timeFrameDiversityWeight: 0.1,
            maxConsecutiveSimilarTopics: 3,
            maxConsecutiveSameAuthor: 2,
            maxConsecutiveSameContentType: 3,
            ...config,
        }
    }

    /**
     * Aplica critérios de diversidade a uma lista de posts ranqueados
     *
     * @param rankedPosts Lista de posts ranqueados por relevância
     * @param config Configuração de diversidade personalizada
     * @returns Lista re-ordenada com diversidade aplicada
     */
    public applyDiversity(
        rankedPosts: RankedPost[],
        config?: Partial<DiversityConfig>
    ): RankedPost[] {
        if (rankedPosts.length <= 2) {
            return [...rankedPosts] // Não há necessidade de diversificar listas muito pequenas
        }

        const diversityConfig = { ...this.defaultConfig, ...config }

        // Preservar os top N posts em suas posições originais
        const topPostCount = Math.min(3, Math.floor(rankedPosts.length * 0.2))
        const topPosts = rankedPosts.slice(0, topPostCount)
        const postsToReorder = rankedPosts.slice(topPostCount)

        // Análise de diversidade
        const diversityInfo = this.analyzeDiversity(postsToReorder)

        // Reordenar posts para aumentar diversidade
        const reorderedPosts = this.reorderForDiversity(
            postsToReorder,
            diversityInfo,
            diversityConfig
        )

        // Combinar top posts com posts reordenados
        return [...topPosts, ...reorderedPosts]
    }

    /**
     * Analisa a diversidade de uma lista de posts
     */
    private analyzeDiversity(posts: RankedPost[]): {
        topicFrequency: Map<string, number>
        authorFrequency: Map<string | bigint, number>
        contentTypeFrequency: Map<string, number>
        timeDistribution: number[]
    } {
        const topicFrequency = new Map<string, number>()
        const authorFrequency = new Map<string | bigint, number>()
        const contentTypeFrequency = new Map<string, number>()
        const timeSegments = 6 // Dividir o período de tempo em 6 segmentos
        const timeDistribution = new Array(timeSegments).fill(0)

        // Encontrar tempo mínimo e máximo
        let minTime = Number.MAX_SAFE_INTEGER
        let maxTime = 0

        posts.forEach((post) => {
            const timestamp = post.createdAt.getTime()
            minTime = Math.min(minTime, timestamp)
            maxTime = Math.max(maxTime, timestamp)
        })

        const timeRange = maxTime - minTime

        // Analisar cada post
        posts.forEach((post) => {
            // Contagem de tópicos
            if (post.topics) {
                post.topics.forEach((topic) => {
                    const count = topicFrequency.get(topic) || 0
                    topicFrequency.set(topic, count + 1)
                })
            }

            // Contagem de autores
            const authorCount = authorFrequency.get(post.authorId) || 0
            authorFrequency.set(post.authorId, authorCount + 1)

            // Contagem de tipos de conteúdo
            if (post.contentType) {
                const contentCount = contentTypeFrequency.get(post.contentType) || 0
                contentTypeFrequency.set(post.contentType, contentCount + 1)
            }

            // Distribuição temporal
            if (timeRange > 0) {
                const timestamp = post.createdAt.getTime()
                const relativePosition = (timestamp - minTime) / timeRange
                const segment = Math.min(
                    timeSegments - 1,
                    Math.floor(relativePosition * timeSegments)
                )
                timeDistribution[segment]++
            }
        })

        return {
            topicFrequency,
            authorFrequency,
            contentTypeFrequency,
            timeDistribution,
        }
    }

    /**
     * Reordena posts para maximizar a diversidade
     */
    private reorderForDiversity(
        posts: RankedPost[],
        diversityInfo: ReturnType<typeof this.analyzeDiversity>,
        config: DiversityConfig
    ): RankedPost[] {
        // Copiar posts para não modificar o original
        const availablePosts = [...posts]
        const result: RankedPost[] = []

        // Registrar o último post selecionado
        let lastSelectedAuthor: string | bigint | null = null
        let lastSelectedContentType: string | null = null
        let consecutiveSameAuthor = 0
        let consecutiveSameContentType = 0
        const recentTopics = new Set<string>()

        // Enquanto temos posts disponíveis
        while (availablePosts.length > 0) {
            let bestIndex = 0
            let bestScore = -1

            // Avaliar cada post candidato
            for (let i = 0; i < availablePosts.length; i++) {
                const post = availablePosts[i]

                // Calcular score de diversidade
                const diversityScore = this.calculateDiversityScore(
                    post,
                    lastSelectedAuthor,
                    lastSelectedContentType,
                    recentTopics,
                    consecutiveSameAuthor,
                    consecutiveSameContentType,
                    config
                )

                // Se o score é melhor ou se é o primeiro
                if (diversityScore > bestScore) {
                    bestScore = diversityScore
                    bestIndex = i
                }
            }

            // Adicionar melhor post ao resultado
            const selectedPost = availablePosts[bestIndex]
            result.push(selectedPost)

            // Atualizar estado
            if (selectedPost.authorId === lastSelectedAuthor) {
                consecutiveSameAuthor++
            } else {
                consecutiveSameAuthor = 0
                lastSelectedAuthor = selectedPost.authorId
            }

            if (selectedPost.contentType === lastSelectedContentType) {
                consecutiveSameContentType++
            } else {
                consecutiveSameContentType = 0
                lastSelectedContentType = selectedPost.contentType || null
            }

            // Atualizar tópicos recentes
            if (selectedPost.topics) {
                // Adicionar tópicos atuais
                selectedPost.topics.forEach((topic) => recentTopics.add(topic))

                // Limitar tamanho do conjunto
                if (recentTopics.size > 10) {
                    // Remover tópicos mais antigos
                    const topicsArray = Array.from(recentTopics)
                    topicsArray.slice(0, topicsArray.length - 10).forEach((topic) => {
                        recentTopics.delete(topic)
                    })
                }
            }

            // Remover o post selecionado da lista de disponíveis
            availablePosts.splice(bestIndex, 1)
        }

        return result
    }

    /**
     * Calcula o score de diversidade para um post específico
     */
    private calculateDiversityScore(
        post: RankedPost,
        lastAuthor: string | bigint | null,
        lastContentType: string | null,
        recentTopics: Set<string>,
        consecutiveSameAuthor: number,
        consecutiveSameContentType: number,
        config: DiversityConfig
    ): number {
        let score = 0

        // Fator 1: Evitar mesmo autor consecutivo além do limite
        if (post.authorId === lastAuthor) {
            if (consecutiveSameAuthor >= config.maxConsecutiveSameAuthor) {
                score -= 0.5 // Penalização forte
            } else {
                score -= 0.2 * config.authorDiversityWeight
            }
        } else {
            score += 0.2 * config.authorDiversityWeight
        }

        // Fator 2: Evitar mesmo tipo de conteúdo consecutivo além do limite
        if (post.contentType === lastContentType) {
            if (consecutiveSameContentType >= config.maxConsecutiveSameContentType) {
                score -= 0.4 // Penalização
            } else {
                score -= 0.1 * config.contentTypeDiversityWeight
            }
        } else {
            score += 0.2 * config.contentTypeDiversityWeight
        }

        // Fator 3: Promover diversidade de tópicos
        if (post.topics && post.topics.length > 0) {
            const topicOverlap = post.topics.filter((topic) => recentTopics.has(topic)).length
            const overlapRatio = topicOverlap / post.topics.length

            if (overlapRatio > 0.7) {
                score -= 0.3 * config.topicDiversityWeight // Alta sobreposição
            } else if (overlapRatio < 0.3) {
                score += 0.3 * config.topicDiversityWeight // Baixa sobreposição, premiar
            }
        }

        // Fator 4: Usar o score original (relevância) como fator de tie-breaking
        score += 0.2 * post.score

        return score
    }
}
