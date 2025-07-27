import { Candidate, RankedCandidate, RankingOptions, UserEmbedding } from "../types"
import { getLogger } from "../utils/logger"
import { RankingParams as Params } from "../../params"
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
                try {
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
                } catch (error) {
                    // Em caso de erro no cálculo individual, retornar scores padrão
                    return {
                        ...candidate,
                        relevanceScore: 0.5,
                        engagementScore: 0.5,
                        noveltyScore: 0.5,
                        diversityScore: 0.5,
                        contextScore: 0.5,
                        finalScore: 0.5,
                    }
                }
            })

            // Ordenar por score final (decrescente)
            rankedCandidates.sort((a, b) => b.finalScore - a.finalScore)

            // Aplicar estratégia de diversificação se necessário
            const diversifiedCandidates = this.applyDiversityStrategy(rankedCandidates, options)

            // Aplicar limite após a diversificação
            return options.limit ? diversifiedCandidates.slice(0, options.limit) : diversifiedCandidates
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
            })).slice(0, options.limit)
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
            if (!candidate.created_at) {
                return 0.5
            }

            let createdAt: Date
            try {
                createdAt = typeof candidate.created_at === "string"
                    ? new Date(candidate.created_at)
                    : candidate.created_at

                // Verificar se a data é válida
                if (isNaN(createdAt.getTime())) {
                    return 0.5
                }
            } catch {
                return 0.5
            }

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
     * Calcula score de diversidade baseado em características do conteúdo
     * e histórico de interações do usuário
     */
    private calculateDiversityScore(candidate: Candidate): number {
        try {
            // Se não temos dados suficientes, retornar score padrão
            if (!candidate.statistics || !candidate.tags || !Array.isArray(candidate.tags)) {
                this.logger.debug("Dados insuficientes para cálculo de diversidade, usando score padrão")
                return Params.defaultScores.diversity
            }

            // Validar e filtrar tags inválidas
            const validTags = candidate.tags.filter(tag => 
                typeof tag === 'string' && tag.trim().length > 0
            )

            if (validTags.length === 0) {
                this.logger.debug("Nenhuma tag válida encontrada, usando score padrão")
                return Params.defaultScores.diversity
            }

            // Calcular diversidade baseada em tags
            const tagDiversity = this.calculateTagDiversity(validTags)
            
            // Calcular diversidade baseada em engajamento
            const engagementDiversity = this.calculateEngagementDiversity(candidate.statistics)
            
            // Combinar scores com pesos
            const finalScore = (
                tagDiversity * Params.diversityWeights.tags +
                engagementDiversity * Params.diversityWeights.engagement
            )

            // Garantir que o score final está no intervalo [0,1]
            return Math.max(0, Math.min(1, finalScore))
        } catch (error) {
            this.logger.error("Erro ao calcular score de diversidade:", error)
            return Params.defaultScores.diversity
        }
    }

    /**
     * Calcula diversidade baseada nas tags do conteúdo
     */
    private calculateTagDiversity(tags: string[]): number {
        if (!tags || tags.length === 0) {
            return Params.defaultScores.diversity
        }

        try {
            // Remover duplicatas e normalizar tags
            const uniqueTags = [...new Set(tags.map(tag => tag.toLowerCase().trim()))]
            
            // Normalizar número de tags (mais tags = mais diverso)
            const tagCount = Math.min(uniqueTags.length, Params.maxTags)
            
            // Aplicar função de suavização para evitar saltos bruscos
            const normalizedScore = Math.tanh(tagCount / (Params.maxTags / 2))
            
            return (normalizedScore + 1) / 2 // Converter para [0,1]
        } catch (error) {
            this.logger.error("Erro ao calcular diversidade de tags:", error)
            return Params.defaultScores.diversity
        }
    }

    /**
     * Calcula diversidade baseada no padrão de engajamento
     */
    private calculateEngagementDiversity(stats: NonNullable<Candidate['statistics']>): number {
        try {
            if (!stats) return Params.defaultScores.diversity

            // Normalizar métricas de engajamento
            const normalizedStats = {
                likes: Math.log10((stats.likes || 0) + 1) / Math.log10(1000),
                comments: Math.log10((stats.comments || 0) + 1) / Math.log10(100),
                shares: Math.log10((stats.shares || 0) + 1) / Math.log10(50)
            }

            // Calcular razão entre diferentes tipos de engajamento
            const totalEngagement = normalizedStats.likes + normalizedStats.comments + normalizedStats.shares
            if (totalEngagement === 0) return Params.defaultScores.diversity

            const commentRatio = normalizedStats.comments / totalEngagement
            const shareRatio = normalizedStats.shares / totalEngagement
            const likeRatio = normalizedStats.likes / totalEngagement

            // Calcular entropia de Shannon para medir diversidade
            const entropy = -(
                (likeRatio * Math.log2(likeRatio + 1e-10)) +
                (commentRatio * Math.log2(commentRatio + 1e-10)) +
                (shareRatio * Math.log2(shareRatio + 1e-10))
            )

            // Normalizar entropia para [0,1]
            const maxEntropy = Math.log2(3) // Máxima entropia para 3 tipos de engajamento
            const normalizedEntropy = entropy / maxEntropy

            return Math.max(Params.defaultScores.diversity, normalizedEntropy)
        } catch (error) {
            this.logger.error("Erro ao calcular diversidade de engajamento:", error)
            return Params.defaultScores.diversity
        }
    }

    /**
     * Calcula score de contexto baseado no momento atual e preferências do usuário
     */
    private calculateContextScore(candidate: Candidate, options: RankingOptions): number {
        try {
            if (!options.context) {
                return Params.defaultScores.context
            }

            const context = options.context
            let score = Params.defaultScores.context
            let weightSum = 0

            // Ajustar score baseado no horário do dia
            if (typeof context.timeOfDay === 'number' && context.timeOfDay >= 0 && context.timeOfDay < 24) {
                const timeScore = this.calculateTimeOfDayScore(context.timeOfDay)
                score += timeScore
                weightSum++
            }

            // Ajustar score baseado no dia da semana
            if (typeof context.dayOfWeek === 'number' && context.dayOfWeek >= 0 && context.dayOfWeek < 7) {
                const dayScore = this.calculateDayOfWeekScore(context.dayOfWeek)
                score += dayScore
                weightSum++
            }

            // Ajustar score baseado na localização
            if (typeof context.location === 'string' && context.location.trim().length > 0) {
                const locationScore = this.calculateLocationScore(context.location, candidate)
                score += locationScore
                weightSum++
            }

            // Normalizar score final para [0,1]
            return weightSum > 0 
                ? Math.min(1, Math.max(0, score / weightSum))
                : Params.defaultScores.context
        } catch (error) {
            this.logger.error("Erro ao calcular score de contexto:", error)
            return Params.defaultScores.context
        }
    }

    /**
     * Calcula ajuste de score baseado no horário do dia
     */
    private calculateTimeOfDayScore(hour: number): number {
        try {
            // Horários de pico (manhã e noite) recebem scores mais altos
            const morningPeak = hour >= 7 && hour <= 9
            const eveningPeak = hour >= 18 && hour <= 21
            
            if (morningPeak || eveningPeak) {
                return Params.contextWeights.peakHours
            }
            
            // Horários de baixo engajamento recebem scores mais baixos
            const lowEngagement = hour >= 0 && hour <= 5
            if (lowEngagement) {
                return Params.contextWeights.lowEngagementHours
            }
            
            // Aplicar função de suavização para transições
            const distanceFromPeak = Math.min(
                Math.abs(hour - 8), // Distância do pico da manhã
                Math.abs(hour - 19) // Distância do pico da noite
            )
            
            const smoothFactor = Math.exp(-distanceFromPeak / 4) // Suavização exponencial
            return Params.contextWeights.normalHours * (1 + smoothFactor)
        } catch (error) {
            this.logger.error("Erro ao calcular score de horário:", error)
            return Params.contextWeights.normalHours
        }
    }

    /**
     * Calcula ajuste de score baseado no dia da semana
     */
    private calculateDayOfWeekScore(day: number): number {
        try {
            // Fim de semana (0 = domingo, 6 = sábado) recebe score mais alto
            if (day === 0 || day === 6) {
                return Params.contextWeights.weekend
            }
            
            // Meio da semana recebe score médio
            if (day >= 2 && day <= 4) {
                return Params.contextWeights.midWeek
            }
            
            // Segunda e sexta recebem score intermediário
            return Params.contextWeights.weekStartEnd
        } catch (error) {
            this.logger.error("Erro ao calcular score de dia da semana:", error)
            return Params.contextWeights.midWeek
        }
    }

    /**
     * Calcula ajuste de score baseado na localização
     */
    private calculateLocationScore(location: string, candidate: Candidate): number {
        try {
            // Normalizar localizações para comparação
            const normalizeLocation = (loc: string) => loc.trim().toUpperCase()
            const normalizedContextLocation = normalizeLocation(location)
            
            // Se o candidato tem localização definida, verificar correspondência
            if (candidate.location) {
                const normalizedCandidateLocation = normalizeLocation(candidate.location)
                
                // Verificar correspondência exata ou parcial
                if (normalizedCandidateLocation === normalizedContextLocation) {
                    return Params.contextWeights.sameLocation
                }
                
                // Verificar se é do mesmo país (primeiros 2 caracteres)
                if (normalizedCandidateLocation.slice(0, 2) === normalizedContextLocation.slice(0, 2)) {
                    return (Params.contextWeights.sameLocation + Params.contextWeights.differentLocation) / 2
                }
            }
            
            return Params.contextWeights.differentLocation
        } catch (error) {
            this.logger.error("Erro ao calcular score de localização:", error)
            return Params.defaultScores.context
        }
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
            relevance: Params.weights.relevance,
            engagement: Params.weights.engagement,
            novelty: Params.weights.novelty,
            diversity: Params.weights.diversity,
            context: Params.weights.context,
        }

        // Ajustar peso da novidade se especificado
        if (options.noveltyLevel !== undefined) {
            const noveltyAdjustment = options.noveltyLevel - Params.noveltyLevel // Base é 0.3
            defaultWeights.novelty += noveltyAdjustment
            defaultWeights.relevance -= noveltyAdjustment / 2
            defaultWeights.engagement -= noveltyAdjustment / 2
        }

        // Ajustar peso da diversidade se especificado
        if (options.diversityLevel !== undefined) {
            const diversityAdjustment = options.diversityLevel - Params.diversityLevel // Base é 0.4
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
        if (!options.diversityLevel || options.diversityLevel < Params.diversityLevel) {
            // Sem diversificação para níveis baixos
            return candidates
        }

        // Para níveis altos de diversidade, intercalamos conteúdos diversos
        const result: RankedCandidate[] = []
        const numTopItems = Math.ceil(candidates.length * Params.noveltyLevel) // Top 30%

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
