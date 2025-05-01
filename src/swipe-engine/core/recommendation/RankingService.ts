import { Candidate, RankedCandidate, RankingOptions, UserEmbedding } from "../types"
import { getLogger } from "../utils/logger"

/**
 * Serviço responsável por classificar candidatos de recomendação baseado em diversos critérios
 */
export class RankingService {
    private readonly logger = getLogger("RankingService")

    constructor() {
        this.logger.info("RankingService inicializado")
    }

    /**
     * Classifica candidatos baseado em critérios múltiplos (relevância, engajamento, etc)
     *
     * @param candidates Lista de candidatos para classificação
     * @param options Opções de classificação incluindo embedding do usuário
     * @returns Lista de candidatos classificados por score
     */
    public rankCandidates(candidates: Candidate[], options: RankingOptions): RankedCandidate[] {
        try {
            this.logger.info(`Classificando ${candidates.length} candidatos`)

            if (!candidates.length) {
                return []
            }

            // Obtém pesos para cada dimensão da classificação
            const weights = this.getWeights(options)

            // Aplicar classificação a cada candidato
            const rankedCandidates = candidates.map((candidate) => {
                // Calcular scores individuais
                const relevanceScore = this.calculateRelevanceScore(candidate, options)
                const engagementScore = this.calculateEngagementScore(candidate)
                const noveltyScore = this.calculateNoveltyScore(candidate)
                const diversityScore = this.calculateDiversityScore(candidate)
                const contextScore = this.calculateContextScore(candidate, options)

                // Calcular score final ponderado
                const finalScore =
                    relevanceScore * weights.relevance +
                    engagementScore * weights.engagement +
                    noveltyScore * weights.novelty +
                    diversityScore * weights.diversity +
                    contextScore * weights.context

                return {
                    ...candidate,
                    relevanceScore,
                    engagementScore,
                    noveltyScore,
                    diversityScore,
                    contextScore,
                    finalScore,
                }
            })

            // Ordenar por score final (decrescente)
            rankedCandidates.sort((a, b) => b.finalScore - a.finalScore)

            // Aplicar estratégia de diversificação se necessário
            return this.applyDiversityStrategy(rankedCandidates, options)
        } catch (error: any) {
            this.logger.error(`Erro ao classificar candidatos: ${error.message}`)
            // Em caso de erro, retornar candidatos sem classificação
            return candidates.map((c) => ({
                ...c,
                relevanceScore: 0.5,
                engagementScore: 0.5,
                noveltyScore: 0.5,
                diversityScore: 0.5,
                contextScore: 0.5,
                finalScore: 0.5,
            }))
        }
    }

    /**
     * Calcula scores para relevância baseado na similaridade com o perfil do usuário
     */
    private calculateRelevanceScore(candidate: Candidate, options: RankingOptions): number {
        // Se tivermos embeddings, calcular similaridade
        if (options.userEmbedding && candidate.embedding) {
            return this.calculateEmbeddingSimilarity(options.userEmbedding, candidate.embedding)
        }

        // Se tivermos score de cluster, usar diretamente
        if (candidate.clusterScore !== undefined) {
            return candidate.clusterScore
        }

        // Valor padrão se não tivermos dados suficientes
        return 0.5
    }

    /**
     * Calcula similaridade entre embeddings de usuário e candidato
     */
    private calculateEmbeddingSimilarity(
        userEmbedding: UserEmbedding,
        candidateEmbedding: UserEmbedding
    ): number {
        try {
            const userVector = userEmbedding.vector.values
            const candidateVector = candidateEmbedding.vector.values

            // Verificar se os vetores têm o mesmo tamanho
            if (userVector.length !== candidateVector.length) {
                this.logger.warn("Embeddings com dimensões diferentes")
                return 0.5
            }

            // Calcular similaridade de cosseno
            let dotProduct = 0
            let normA = 0
            let normB = 0

            for (let i = 0; i < userVector.length; i++) {
                dotProduct += userVector[i] * candidateVector[i]
                normA += userVector[i] * userVector[i]
                normB += candidateVector[i] * candidateVector[i]
            }

            if (normA === 0 || normB === 0) return 0

            // Converter similaridade para o intervalo [0,1]
            return (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) + 1) / 2
        } catch (error) {
            this.logger.error("Erro ao calcular similaridade de embeddings")
            return 0.5
        }
    }

    /**
     * Calcula score de engajamento baseado em estatísticas históricas
     */
    private calculateEngagementScore(candidate: Candidate): number {
        try {
            if (!candidate.statistics) {
                return 0.5
            }

            const stats = candidate.statistics

            // Soma ponderada de métricas de engajamento
            const totalEngagement =
                (stats.likes || 0) * 1.0 +
                (stats.comments || 0) * 1.5 +
                (stats.shares || 0) * 2.0 +
                (stats.views || 0) * 0.2

            // Normalizar para [0,1] (usando valor arbitrário de 100 como máximo)
            // Em produção, isso seria ajustado com base em dados reais
            return Math.min(1.0, totalEngagement / 100)
        } catch (error) {
            return 0.5
        }
    }

    /**
     * Calcula score de novidade baseado na data de criação
     */
    private calculateNoveltyScore(candidate: Candidate): number {
        try {
            const createdAt =
                typeof candidate.created_at === "string"
                    ? new Date(candidate.created_at)
                    : candidate.created_at

            const now = new Date()
            const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

            // Conteúdo mais recente recebe score mais alto
            // Decai exponencialmente com o tempo (com half-life de 72 horas)
            return Math.exp(-ageInHours / 72)
        } catch (error) {
            return 0.5
        }
    }

    /**
     * Score de diversidade (implementação simplificada)
     */
    private calculateDiversityScore(candidate: Candidate): number {
        // Em produção, isso consideraria a diversidade em relação a outros itens
        // Para simplificar, usamos valor fixo
        return 0.5
    }

    /**
     * Score de contexto baseado no contexto atual (hora do dia, etc)
     */
    private calculateContextScore(candidate: Candidate, options: RankingOptions): number {
        if (!options.context) {
            return 0.5
        }

        // Em produção, isso compararia o contexto atual com metadados do conteúdo
        // Para simplificar, usamos valor fixo
        return 0.5
    }

    /**
     * Obtém pesos para cada dimensão de score baseado nas opções
     */
    private getWeights(options: RankingOptions): {
        relevance: number
        engagement: number
        novelty: number
        diversity: number
        context: number
    } {
        const defaultWeights = {
            relevance: 0.4,
            engagement: 0.25,
            novelty: 0.15,
            diversity: 0.1,
            context: 0.1,
        }

        // Ajustar peso da novidade se especificado
        if (options.noveltyLevel !== undefined) {
            const noveltyAdjustment = options.noveltyLevel - 0.3 // Base é 0.3
            defaultWeights.novelty += noveltyAdjustment
            defaultWeights.relevance -= noveltyAdjustment / 2
            defaultWeights.engagement -= noveltyAdjustment / 2
        }

        // Ajustar peso da diversidade se especificado
        if (options.diversityLevel !== undefined) {
            const diversityAdjustment = options.diversityLevel - 0.4 // Base é 0.4
            defaultWeights.diversity += diversityAdjustment
            defaultWeights.relevance -= diversityAdjustment
        }

        // Normalizar pesos para somar 1
        const sum = Object.values(defaultWeights).reduce((a, b) => a + b, 0)

        return {
            relevance: defaultWeights.relevance / sum,
            engagement: defaultWeights.engagement / sum,
            novelty: defaultWeights.novelty / sum,
            diversity: defaultWeights.diversity / sum,
            context: defaultWeights.context / sum,
        }
    }

    /**
     * Aplica estratégia de diversificação na lista final
     */
    private applyDiversityStrategy(
        candidates: RankedCandidate[],
        options: RankingOptions
    ): RankedCandidate[] {
        if (!options.diversityLevel || options.diversityLevel < 0.6) {
            // Sem diversificação para níveis baixos
            return candidates
        }

        // Para níveis altos de diversidade, intercalamos conteúdos diversos
        const result: RankedCandidate[] = []
        const numTopItems = Math.ceil(candidates.length * 0.3) // Top 30%

        // Adicionar top items sem modificação
        for (let i = 0; i < Math.min(numTopItems, candidates.length); i++) {
            result.push(candidates[i])
        }

        // Para o restante, intercalar itens de diferentes scores para aumentar diversidade
        const remainingItems = candidates.slice(numTopItems)
        const chunks: RankedCandidate[][] = []

        // Dividir em 3 grupos por score
        const chunkSize = Math.ceil(remainingItems.length / 3)
        for (let i = 0; i < remainingItems.length; i += chunkSize) {
            chunks.push(remainingItems.slice(i, i + chunkSize))
        }

        // Intercalar itens dos diferentes grupos
        const maxItems = Math.max(...chunks.map((c) => c.length))
        for (let i = 0; i < maxItems; i++) {
            for (let j = 0; j < chunks.length; j++) {
                if (i < chunks[j].length) {
                    result.push(chunks[j][i])
                }
            }
        }

        return result.slice(0, options.limit || candidates.length)
    }
}
