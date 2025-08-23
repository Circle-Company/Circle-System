import { getLogger } from "../utils/logger"
import { cosineSimilarity, normalizeVector } from "../utils/vector-operations"
import {
    ClusterInfo,
    MatchResult,
    RecommendationContext,
    UserEmbedding,
    UserProfile,
    EmbeddingVector
} from "../types"

/**
 * ClusterMatcher é responsável por encontrar clusters relevantes para um usuário
 * com base em seu embedding e outros fatores contextuais
 */
export class ClusterMatcher {
    private _clusters: ClusterInfo[] = []
    private _minMatchThreshold: number
    private _contextWeight: number
    private _interestWeight: number
    private _embeddingWeight: number
    private _maxClusters: number
    private readonly logger = getLogger("ClusterMatcher")

    /**
     * Constrói uma nova instância de ClusterMatcher
     *
     * @param clusters Informações sobre os clusters disponíveis
     * @param options Opções de configuração para o matcher
     */
    constructor(
        clusters: ClusterInfo[],
        options: {
            minMatchThreshold?: number
            contextWeight?: number
            interestWeight?: number
            embeddingWeight?: number
            maxClusters?: number
        } = {}
    ) {
        this._clusters = clusters
        this._minMatchThreshold = options.minMatchThreshold ?? 0.2
        this._contextWeight = options.contextWeight ?? 0.2
        this._interestWeight = options.interestWeight ?? 0.3
        this._embeddingWeight = options.embeddingWeight ?? 0.5
        this._maxClusters = options.maxClusters ?? 3

        // Validar pesos (devem somar 1.0)
        const sumWeights = this._contextWeight + this._interestWeight + this._embeddingWeight
        if (Math.abs(sumWeights - 1.0) > 0.001) {
            this.logger.warn(`Os pesos devem somar 1.0, mas somam ${sumWeights}. Ajustando...`)

            // Normalizar pesos
            this._contextWeight /= sumWeights
            this._interestWeight /= sumWeights
            this._embeddingWeight /= sumWeights
        }
    }

    /**
     * Encontra clusters relevantes para um usuário com base em sua embedding
     * @param userEmbedding Embedding do usuário
     * @param userProfile Perfil do usuário com informações adicionais
     * @param context Contexto da recomendação (hora do dia, localização, etc.)
     * @returns Lista de resultados de correspondência ordenados por relevância
     */
    public findRelevantClusters(
        userEmbedding: UserEmbedding | null,
        userProfile?: UserProfile | null,
        context?: RecommendationContext
    ): MatchResult[] {
        // Se userEmbedding for null, retornar alguns clusters padrão ou baseados apenas no contexto/perfil
        if (!userEmbedding) {
            this.logger.info(
                "UserEmbedding não fornecido, usando lógica alternativa de recomendação"
            )

            // Se tivermos perfil do usuário, podemos tentar usar apenas isso
            if (userProfile) {
                return this.findClustersByUserProfile(userProfile, context)
            }

            // Caso contrário, retornamos clusters mais populares ou uma seleção aleatória
            return this.getDefaultClusters()
        }

        const normalizedUserEmbedding = normalizeVector(userEmbedding.vector.values)

        // Calcular similaridade com cada cluster
        const matches = this._clusters.map((cluster) => {
            const normalizedClusterVector = normalizeVector(cluster.centroid.values)

            // Similaridade de cosseno entre o usuário e o centroide do cluster
            let similarity = cosineSimilarity(normalizedUserEmbedding, normalizedClusterVector)

            // Ajustar similaridade com base no perfil do usuário e contexto, se disponíveis
            if (userProfile && context) {
                const contextualBoost = this.calculateContextualBoost(userProfile, context, cluster)
                similarity =
                    similarity * (1 - this._contextWeight) + contextualBoost * this._contextWeight
            }

            return {
                clusterId: cluster.id,
                clusterName: cluster.name,
                similarity,
                score: similarity,
                cluster
            } as MatchResult
        })

        // Filtrar matches que estão acima do limiar e ordenar por similaridade
        return matches
            .filter((match) => match.similarity >= this._minMatchThreshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, this._maxClusters)
    }

    /**
     * Encontra clusters baseados apenas no perfil do usuário quando embedding não está disponível
     * @param userProfile Perfil do usuário
     * @param context Contexto opcional da recomendação
     * @returns Lista de resultados de correspondência
     */
    private findClustersByUserProfile(
        userProfile: UserProfile,
        context?: RecommendationContext
    ): MatchResult[] {
        // Calcular similaridade apenas com base no perfil e contexto
        const matches = this._clusters.map((cluster) => {
            let similarity = 0.5 // Base de similaridade neutra

            // Aumentar similaridade com base em interesses compartilhados
            if (userProfile.interests && cluster.topics) {
                const sharedInterests = userProfile.interests.filter((interest) =>
                    cluster.topics?.includes(interest)
                )

                // Adicionar até 0.3 à similaridade com base em interesses compartilhados
                similarity += Math.min(0.3, sharedInterests.length * 0.1)
            }

            // Considerar fatores contextuais se disponíveis
            if (context) {
                const contextualBoost = this.calculateContextualBoost(userProfile, context, cluster)
                similarity += contextualBoost * this._contextWeight
            }

            return {
                clusterId: cluster.id,
                clusterName: cluster.name,
                similarity,
                score: similarity,
                cluster
            } as MatchResult
        })

        // Filtrar, ordenar e limitar os resultados
        return matches
            .filter((match) => match.similarity >= this._minMatchThreshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, this._maxClusters)
    }

    /**
     * Retorna clusters padrão quando não há informações suficientes para recomendação personalizada.
     * Utiliza a propriedade size e densidade para selecionar clusters diversificados.
     * @returns Lista de resultados de correspondência com clusters padrão
     */
    private getDefaultClusters(): MatchResult[] {
        // Se não houver clusters, retornar um array vazio
        if (!this._clusters || this._clusters.length === 0) {
            this.logger.warn("Nenhum cluster disponível para recomendação padrão")
            return []
        }

        // Agrupar clusters por tamanho
        const smallClusters: ClusterInfo[] = []
        const mediumClusters: ClusterInfo[] = []
        const largeClusters: ClusterInfo[] = []

        // Definir limiares de tamanho
        const totalMembers = this._clusters.reduce((sum, c) => sum + (c.size || 0), 0)
        const avgSize = totalMembers / this._clusters.length

        const smallThreshold = avgSize * 0.5
        const largeThreshold = avgSize * 1.5

        // Classificar clusters por tamanho
        this._clusters.forEach((cluster) => {
            const size = cluster.size || 0

            if (size < smallThreshold) {
                smallClusters.push(cluster)
            } else if (size > largeThreshold) {
                largeClusters.push(cluster)
            } else {
                mediumClusters.push(cluster)
            }
        })

        this.logger.debug(
            `Clusters classificados por tamanho: ${smallClusters.length} pequenos, ${mediumClusters.length} médios, ${largeClusters.length} grandes`
        )

        // Estratégia de diversificação:
        // 60% dos resultados de clusters grandes (populares)
        // 30% dos resultados de clusters médios
        // 10% dos resultados de clusters pequenos (nicho)
        const largeCount = Math.ceil(this._maxClusters * 0.6)
        const mediumCount = Math.ceil(this._maxClusters * 0.3)
        const smallCount = this._maxClusters - largeCount - mediumCount

        // Selecionar clusters de cada categoria, priorizando densidade dentro de cada grupo
        const selectedLarge = this.selectTopClusters(largeClusters, largeCount)
        const selectedMedium = this.selectTopClusters(mediumClusters, mediumCount)
        const selectedSmall = this.selectTopClusters(smallClusters, smallCount)

        // Combinar e converter para o formato MatchResult
        const combinedClusters = [...selectedLarge, ...selectedMedium, ...selectedSmall].map(
            (cluster) => {
                // Calcular score baseado no tamanho e densidade do cluster
                const sizeScore = (cluster.size || 0) / (largeThreshold || 1)
                const densityScore = cluster.density || 0.5

                // Similaridade combinada usando pesos ajustados para tamanho e densidade
                const similarity = sizeScore * 0.6 + densityScore * 0.4

                // Score com uma componente aleatória para diversidade
                const score = similarity * 0.8 + Math.random() * 0.2

                return {
                    clusterId: cluster.id,
                    clusterName: cluster.name,
                    similarity,
                    score,
                    cluster
                }
            }
        )

        // Se não conseguimos clusters suficientes com a estratégia de diversificação,
        // complementar com os clusters ordenados por tamanho
        if (combinedClusters.length < this._maxClusters) {
            this.logger.debug(
                `Estratégia de diversificação não obteve clusters suficientes (${combinedClusters.length}/${this._maxClusters}), complementando...`
            )

            const remainingCount = this._maxClusters - combinedClusters.length
            const remainingClusters = this._clusters
                .filter((cluster) => !combinedClusters.some((c) => c.clusterId === cluster.id))
                .sort((a, b) => (b.size || 0) - (a.size || 0))
                .slice(0, remainingCount)
                .map((cluster) => {
                    // Calcular score baseado no tamanho e densidade do cluster
                    const sizeScore = (cluster.size || 0) / (largeThreshold || 1)
                    const densityScore = cluster.density || 0.5

                    // Similaridade combinada usando pesos ajustados para tamanho e densidade
                    const similarity = sizeScore * 0.6 + densityScore * 0.4

                    // Reduzir score para clusters remanescentes para priorizar os selecionados inicialmente
                    const score = similarity * 0.7 + Math.random() * 0.1

                    return {
                        clusterId: cluster.id,
                        clusterName: cluster.name,
                        similarity,
                        score,
                        cluster
                    }
                })

            return [...combinedClusters, ...remainingClusters]
        }

        return combinedClusters
    }

    /**
     * Seleciona os top clusters de uma lista, priorizando densidade e tamanho
     * @param clusters Lista de clusters para selecionar
     * @param count Número de clusters a selecionar
     * @returns Lista dos top clusters selecionados
     */
    private selectTopClusters(clusters: ClusterInfo[], count: number): ClusterInfo[] {
        if (clusters.length <= count) {
            return [...clusters] // Retornar todos se não tivermos clusters suficientes
        }

        // Ordenar por uma combinação de tamanho e densidade
        return [...clusters]
            .sort((a, b) => {
                // Se temos informação de densidade, usar como critério principal
                const densityA = a.density !== undefined ? a.density : 0
                const densityB = b.density !== undefined ? b.density : 0

                // Se as densidades forem significativamente diferentes, ordenar por densidade
                if (Math.abs(densityA - densityB) > 0.1) {
                    return densityB - densityA
                }

                // Caso contrário, ordenar por tamanho
                return (b.size || 0) - (a.size || 0)
            })
            .slice(0, count)
    }

    /**
     * Calcula um bônus de relevância baseado em fatores contextuais
     * @param userProfile Perfil do usuário
     * @param context Contexto da recomendação
     * @param cluster Informações do cluster
     * @returns Valor de boost contextual (0-1)
     */
    private calculateContextualBoost(
        userProfile: UserProfile,
        context: RecommendationContext,
        cluster: ClusterInfo
    ): number {
        let boost = 0

        // Boost baseado na hora do dia
        if (context.timeOfDay && cluster.activeTimeOfDay) {
            const timeMatch = this.isTimeInRange(context.timeOfDay, cluster.activeTimeOfDay)
            boost += timeMatch ? 0.2 : 0
        }

        // Boost baseado em interesses compartilhados
        if (userProfile.interests && cluster.topics) {
            const sharedInterests = userProfile.interests.filter((interest) =>
                cluster.topics?.includes(interest)
            )

            boost += Math.min(0.3, sharedInterests.length * 0.1)
        }

        // Boost baseado em localização
        if (context.location && this.getPreferredLocations(cluster)?.includes(context.location)) {
            boost += 0.15
        }

        // Boost baseado em idioma
        if (
            userProfile.demographics?.language &&
            this.getClusterLanguages(cluster)?.includes(userProfile.demographics.language)
        ) {
            boost += 0.15
        }

        return Math.min(1, boost)
    }

    /**
     * Retorna as localizações preferidas pelo cluster de forma segura
     * @param cluster Informações do cluster
     * @returns Array de localizações ou undefined
     */
    private getPreferredLocations(cluster: ClusterInfo): string[] | undefined {
        // Verificar as diferentes possíveis propriedades para localizações
        return (cluster as any).geographicFocus ? [(cluster as any).geographicFocus] : undefined
    }

    /**
     * Retorna os idiomas dominantes do cluster de forma segura
     * @param cluster Informações do cluster
     * @returns Array de idiomas ou undefined
     */
    private getClusterLanguages(cluster: ClusterInfo): string[] | undefined {
        // Verificar as diferentes possíveis propriedades para idiomas
        return (cluster as any).dominantLanguages
    }

    /**
     * Verifica se uma hora do dia está dentro do intervalo ativo do cluster
     * @param timeOfDay Hora do dia (0-23) ou string ("morning", "afternoon", etc.)
     * @param activeTimeRange Intervalo de tempo ativo do cluster
     * @returns true se a hora está no intervalo ativo
     */
    private isTimeInRange(timeOfDay: string | number, activeTimeRange: any): boolean {
        // Se timeOfDay for uma string como "morning", "afternoon", etc.
        if (typeof timeOfDay === "string" && Array.isArray(activeTimeRange)) {
            return activeTimeRange.includes(timeOfDay as any)
        }

        // Se timeOfDay for um número (hora) e activeTimeRange for um intervalo de números
        if (
            typeof timeOfDay === "number" &&
            Array.isArray(activeTimeRange) &&
            activeTimeRange.length === 2 &&
            typeof activeTimeRange[0] === "number" &&
            typeof activeTimeRange[1] === "number"
        ) {
            const [start, end] = activeTimeRange as [number, number]

            // Verificar se está no intervalo, considerando que o intervalo pode atravessar a meia-noite
            if (start <= end) {
                return timeOfDay >= start && timeOfDay <= end
            } else {
                return timeOfDay >= start || timeOfDay <= end
            }
        }

        return false
    }

    /**
     * Retorna estatísticas sobre os clusters disponíveis no sistema
     * @returns Objeto com estatísticas dos clusters
     */
    public getClusterStats(): Record<string, any> {
        if (!this._clusters || this._clusters.length === 0) {
            return {
                count: 0,
                isEmpty: true,
                message: "Nenhum cluster disponível",
            }
        }

        // Estatísticas básicas
        const sizes = this._clusters.map((c) => c.size || 0)
        const densities = this._clusters
            .filter((c) => c.density !== undefined)
            .map((c) => c.density as number)

        // Calcular distribuição de tamanho
        const totalSize = sizes.reduce((sum, size) => sum + size, 0)
        const avgSize = totalSize / sizes.length
        const maxSize = Math.max(...sizes)
        const minSize = Math.min(...sizes)

        // Estatísticas de densidade, se disponíveis
        let densityStats = {}
        if (densities.length > 0) {
            const avgDensity = densities.reduce((sum, d) => sum + d, 0) / densities.length
            const maxDensity = Math.max(...densities)
            const minDensity = Math.min(...densities)

            densityStats = {
                avgDensity,
                maxDensity,
                minDensity,
                hasDensityInfo: true,
            }
        } else {
            densityStats = {
                hasDensityInfo: false,
                message: "Informações de densidade não disponíveis",
            }
        }

        // Distribuição de tamanhos
        const sizeDistribution = {
            small: sizes.filter((s) => s < avgSize * 0.5).length,
            medium: sizes.filter((s) => s >= avgSize * 0.5 && s <= avgSize * 1.5).length,
            large: sizes.filter((s) => s > avgSize * 1.5).length,
        }

        // Informações de tópicos
        const allTopics = new Set<string>()
        this._clusters.forEach((cluster) => {
            if (cluster.topics && Array.isArray(cluster.topics)) {
                cluster.topics.forEach((topic) => allTopics.add(topic))
            }
        })

        // Clusters com propriedades específicas
        const withLocations = this._clusters.filter(
            (c) => this.getPreferredLocations(c) !== undefined
        ).length
        const withLanguages = this._clusters.filter(
            (c) => this.getClusterLanguages(c) !== undefined
        ).length
        const withActiveTime = this._clusters.filter((c) => c.activeTimeOfDay !== undefined).length

        return {
            count: this._clusters.length,
            totalMembers: totalSize,
            sizeStats: {
                avgSize,
                maxSize,
                minSize,
                sizeDistribution,
            },
            densityStats,
            topicStats: {
                uniqueTopicsCount: allTopics.size,
                topicsPerCluster:
                    this._clusters.reduce((sum, c) => sum + (c.topics?.length || 0), 0) /
                    this._clusters.length,
            },
            propertiesStats: {
                withLocations,
                withLanguages,
                withActiveTime,
            },
        }
    }

    /**
     * Atualiza a lista de clusters disponíveis
     * @param clusters Nova lista de clusters
     */
    public updateClusters(clusters: ClusterInfo[]): void {
        this._clusters = clusters
        this.logger.info(`Clusters atualizados: ${clusters.length} clusters disponíveis`)
    }
}
