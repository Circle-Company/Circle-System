/**
 * Processador de Feedback
 *
 * Esta classe processa as interações dos usuários para melhorar as recomendações
 * atualizando os embeddings de usuários e posts com base no comportamento real.
 */

import { PostEmbeddingService } from "../embeddings/PostEmbeddingService"
import { UserEmbeddingService } from "../embeddings/UserEmbeddingService"
import { InteractionType, UserInteraction } from "../types"
import { Logger } from "../utils/logger"
import { normalizeVector } from "../utils/vector-operations"
import { EmbeddingParams as Params } from "../../params"

export class FeedbackProcessor {
    private readonly userEmbeddingService: UserEmbeddingService
    private readonly postEmbeddingService: PostEmbeddingService
    private readonly interactionStrengths: Map<InteractionType, number>
    private readonly batchSize: number
    private readonly logger: Logger
    private pendingInteractions: UserInteraction[]

    /**
     * Cria uma nova instância do processador de feedback
     * @param userEmbeddingService Serviço de embeddings de usuários
     * @param postEmbeddingService Serviço de embeddings de posts
     * @param logger Instância de logger para monitoramento
     * @param batchSize Tamanho do lote para processamento em lote
     */
    constructor(
        userEmbeddingService: UserEmbeddingService,
        postEmbeddingService: PostEmbeddingService,
        logger: Logger,
        batchSize: number = Params.batchProcessing.size
    ) {
        this.userEmbeddingService = userEmbeddingService
        this.postEmbeddingService = postEmbeddingService
        this.logger = logger
        this.batchSize = batchSize
        this.pendingInteractions = []

        // Configurar pesos para diferentes tipos de interação
        this.interactionStrengths = new Map<InteractionType, number>(
            Object.entries(Params.feedback.interactionStrengths) as [InteractionType, number][]
        )
    }

    /**
     * Processa uma única interação do usuário
     * @param interaction A interação a ser processada
     * @returns Verdadeiro se o processamento foi bem-sucedido
     */
    public async processInteraction(interaction: UserInteraction): Promise<boolean> {
        try {
            // Registrar a interação para processamento em lote posterior
            this.pendingInteractions.push(interaction)

            // Processar imediatamente se atingir o tamanho do lote
            if (this.pendingInteractions.length >= this.batchSize) {
                await this.processBatch()
            }

            // Processar imediatamente interações de alta prioridade
            if (
                interaction.type === "like" ||
                interaction.type === "share" ||
                interaction.type === "like_comment" ||
                interaction.type === "report"
            ) {
                await this.updateEmbeddings(interaction)
            }

            return true
        } catch (error) {
            this.logger.error("Erro ao processar interação", {
                error,
                interactionId: interaction.id,
                userId: interaction.userId,
                entityId: interaction.entityId,
            })
            return false
        }
    }

    /**
     * Processa um lote de interações pendentes
     * @returns Número de interações processadas com sucesso
     */
    public async processBatch(): Promise<number> {
        if (this.pendingInteractions.length === 0) {
            return 0
        }

        // Ordenar interações por timestamp para garantir ordem cronológica
        const sortedInteractions = [...this.pendingInteractions].sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        )

        // Limpar lista de interações pendentes
        this.pendingInteractions = []

        let successCount = 0

        try {
            // Agrupar interações por usuário para processamento eficiente
            const userInteractionsMap = this.groupByUserId(sortedInteractions)

            // Processar cada grupo de interações de usuário
            for (const [userId, userInteractions] of userInteractionsMap.entries()) {
                try {
                    // Processar interações deste usuário
                    await this.processUserInteractions(userId, userInteractions)
                    successCount += userInteractions.length
                } catch (error) {
                    // Registrar falha, mas continuar com outros usuários
                    this.logger.error("Erro ao processar interações do usuário", {
                        error,
                        userId,
                        interactionCount: userInteractions.length,
                    })
                }
            }

            // Atualizar embeddings de posts afetados
            await this.updatePostEmbeddings(sortedInteractions)

            // Processar efeitos de rede (alterações em embeddings de um item afetam outros)
            await this.processNetworkEffects(sortedInteractions)

            return successCount
        } catch (error) {
            this.logger.error("Erro ao processar lote de interações", {
                error,
                batchSize: sortedInteractions.length,
            })

            // Adicionar interações de volta à fila para tentar novamente mais tarde
            this.pendingInteractions.push(...sortedInteractions)

            return successCount
        }
    }

    /**
     * Agrupa interações por ID de usuário
     * @param interactions Lista de interações para agrupar
     * @returns Mapa de interações agrupadas por ID de usuário
     */
    private groupByUserId(interactions: UserInteraction[]): Map<bigint, UserInteraction[]> {
        const userInteractionsMap = new Map<bigint, UserInteraction[]>()

        for (const interaction of interactions) {
            if (!userInteractionsMap.has(interaction.userId)) {
                userInteractionsMap.set(interaction.userId, [])
            }

            userInteractionsMap.get(interaction.userId)?.push(interaction)
        }

        return userInteractionsMap
    }

    /**
     * Processa todas as interações de um único usuário
     * @param userId ID do usuário
     * @param interactions Interações do usuário
     */
    private async processUserInteractions(
        userId: bigint,
        interactions: UserInteraction[]
    ): Promise<void> {
        // Obter embedding atual do usuário
        const userEmbedding = await this.userEmbeddingService.getUserEmbedding(userId)

        if (!userEmbedding) {
            this.logger.warn("Embedding do usuário não encontrado", { userId })
            return
        }

        // Calcular ajustes de embedding para cada interação
        let embeddingUpdates = new Array(this.getVectorDimension(userEmbedding)).fill(0)

        for (const interaction of interactions) {
            try {
                // Obter embedding do post/entidade
                const entityEmbedding = await this.postEmbeddingService.getPostEmbedding(
                    interaction.entityId
                )

                if (!entityEmbedding) {
                    this.logger.warn("Embedding da entidade não encontrado", {
                        entityId: interaction.entityId,
                        entityType: interaction.entityType,
                    })
                    continue
                }

                // Obter força da interação
                const strength = this.getInteractionStrength(interaction)

                // Calcular ajuste ao embedding do usuário com base na interação
                for (let i = 0; i < embeddingUpdates.length; i++) {
                    // Ajustar o embedding do usuário na direção do embedding do item
                    // Para interações positivas: aproximar o usuário do item
                    // Para interações negativas: afastar o usuário do item
                    embeddingUpdates[i] += this.getVectorValues(entityEmbedding)[i] * strength
                }
            } catch (error) {
                this.logger.error("Erro ao processar interação individual", {
                    error,
                    interactionId: interaction.id,
                    userId: interaction.userId,
                })
            }
        }

        // Normalizar o vetor de atualização
        const normalizedUpdates = normalizeVector(embeddingUpdates)

        // Aplicar as atualizações ao embedding do usuário, com taxa de aprendizado
        const learningRate = Params.feedback.learningRates.user.normal
        const newUserVector = new Array(this.getVectorDimension(userEmbedding)).fill(0)

        for (let i = 0; i < newUserVector.length; i++) {
            newUserVector[i] =
                this.getVectorValues(userEmbedding)[i] + normalizedUpdates[i] * learningRate
        }

        // Normalizar o vetor final
        const normalizedUserVector = normalizeVector(newUserVector)

        // Salvar o embedding atualizado
        await this.userEmbeddingService.updateEmbedding(
            this.getVectorValues(userEmbedding),
            interactions[interactions.length - 1] // Última interação
        )
    }

    /**
     * Atualiza os embeddings dos posts com base nas interações recebidas
     * @param interactions Lista de interações a serem processadas
     */
    private async updatePostEmbeddings(interactions: UserInteraction[]): Promise<void> {
        // Agrupar interações por postId
        const postInteractions = new Map<bigint, UserInteraction[]>()

        for (const interaction of interactions) {
            if (!postInteractions.has(interaction.entityId)) {
                postInteractions.set(interaction.entityId, [])
            }

            postInteractions.get(interaction.entityId)?.push(interaction)
        }

        // Processar cada post
        for (const [postId, interactions] of postInteractions.entries()) {
            try {
                // Obter embedding atual do post
                const postEmbedding = await this.postEmbeddingService.getPostEmbedding(postId)

                if (!postEmbedding) {
                    continue
                }

                // Aqui usamos uma abordagem diferente: o embedding do post é influenciado
                // pelos embeddings dos usuários que interagiram com ele
                let embeddingUpdates = new Array(this.getVectorDimension(postEmbedding)).fill(0)
                let totalWeight = 0

                for (const interaction of interactions) {
                    const userEmbedding = await this.userEmbeddingService.getUserEmbedding(
                        interaction.userId
                    )

                    if (!userEmbedding) {
                        continue
                    }

                    const strength = this.getInteractionStrength(interaction)
                    const weight = Math.abs(strength) // Usando valor absoluto para o peso

                    for (let i = 0; i < embeddingUpdates.length; i++) {
                        embeddingUpdates[i] += this.getVectorValues(userEmbedding)[i] * weight
                    }

                    totalWeight += weight
                }

                if (totalWeight > 0) {
                    // Normalizar pela soma dos pesos
                    for (let i = 0; i < embeddingUpdates.length; i++) {
                        embeddingUpdates[i] /= totalWeight
                    }

                    // Normalizar o vetor
                    const normalizedUpdates = normalizeVector(embeddingUpdates)

                    // Aplicar atualização ao embedding do post (taxa de aprendizado menor para posts)
                    const learningRate = Params.feedback.learningRates.post.normal
                    const newPostVector = new Array(this.getVectorDimension(postEmbedding)).fill(0)

                    for (let i = 0; i < newPostVector.length; i++) {
                        newPostVector[i] =
                            this.getVectorValues(postEmbedding)[i] +
                            normalizedUpdates[i] * learningRate
                    }

                    // Normalizar o vetor final
                    const normalizedPostVector = normalizeVector(newPostVector)

                    // Salvar o embedding atualizado
                    await this.postEmbeddingService.updateEmbedding(
                        this.getVectorValues(postEmbedding),
                        {
                            lastInteraction: new Date(),
                        }
                    )
                }
            } catch (error) {
                this.logger.error("Erro ao atualizar embedding do post", {
                    error,
                    postId,
                })
            }
        }
    }

    /**
     * Processa efeitos de rede causados por alterações de embeddings
     * @param interactions Lista de interações
     */
    private async processNetworkEffects(interactions: UserInteraction[]): Promise<void> {
        // Este método implementaria a propagação de efeitos secundários
        // Por exemplo, interações com postagens semelhantes podem afetar umas às outras
        // e usuários semelhantes podem ter seus embeddings afetados indiretamente

        // Exemplo de implementação simples: atualizar embeddings de posts similares

        // Primeiro, identificar os posts únicos nas interações
        const uniquePostIds = new Set<bigint>()

        for (const interaction of interactions) {
            uniquePostIds.add(interaction.entityId)
        }

        // Para cada post, encontrar posts similares e ajustar ligeiramente seus embeddings
        for (const postId of uniquePostIds) {
            try {
                // Buscar embedding do post
                const postEmbedding = await this.postEmbeddingService.getPostEmbedding(postId)

                if (!postEmbedding) {
                    continue
                }

                // Encontrar posts similares (simplificado - em uma implementação real,
                // isso seria feito com uma busca vetorial eficiente)
                const similarPosts = await this.postEmbeddingService.findSimilarPosts(
                    postId,
                    Params.feedback.networkEffects.similarPostsLimit,
                    Params.feedback.networkEffects.similarityThreshold
                )

                if (!similarPosts || similarPosts.length === 0) {
                    continue
                }

                // Aplicar uma pequena atualização aos posts similares
                const networkLearningRate = Params.feedback.learningRates.post.networkEffect

                for (const similarPost of similarPosts) {
                    const similarPostEmbedding = await this.postEmbeddingService.getPostEmbedding(
                        similarPost.id
                    )

                    if (!similarPostEmbedding) {
                        continue
                    }

                    // Atualizar embedding do post similar na direção do post original
                    const newVector = new Array(this.getVectorDimension(similarPostEmbedding)).fill(
                        0
                    )

                    for (let i = 0; i < newVector.length; i++) {
                        // Pequeno ajuste na direção do post que recebeu interações
                        newVector[i] =
                            this.getVectorValues(similarPostEmbedding)[i] +
                            (this.getVectorValues(postEmbedding)[i] -
                                this.getVectorValues(similarPostEmbedding)[i]) *
                                networkLearningRate *
                                similarPost.similarity
                    }

                    // Normalizar e salvar
                    const normalizedVector = normalizeVector(newVector)
                    await this.postEmbeddingService.updateEmbedding(
                        this.getVectorValues(similarPostEmbedding),
                        {
                            lastInteraction: new Date(),
                        }
                    )
                }
            } catch (error) {
                this.logger.error("Erro ao processar efeitos de rede", {
                    error,
                    postId,
                })
            }
        }
    }

    /**
     * Atualiza os embeddings com base em uma interação específica
     * @param interaction A interação a ser processada
     */
    private async updateEmbeddings(interaction: UserInteraction): Promise<void> {
        try {
            // Atualizar embedding do usuário
            const userEmbedding = await this.userEmbeddingService.getUserEmbedding(
                interaction.userId
            )
            const entityEmbedding = await this.postEmbeddingService.getPostEmbedding(
                interaction.entityId
            )

            if (!userEmbedding || !entityEmbedding) {
                return
            }

            const strength = this.getInteractionStrength(interaction)
            const learningRate = Params.feedback.learningRates.user.highPriority

            // Criar novo vetor de usuário
            const newUserVector = new Array(this.getVectorDimension(userEmbedding)).fill(0)

            // Atualizar embedding do usuário na direção do item (ou na direção oposta para interações negativas)
            for (let i = 0; i < newUserVector.length; i++) {
                newUserVector[i] =
                    this.getVectorValues(userEmbedding)[i] +
                    (this.getVectorValues(entityEmbedding)[i] -
                        this.getVectorValues(userEmbedding)[i]) *
                        strength *
                        learningRate
            }

            // Normalizar e salvar
            const normalizedUserVector = normalizeVector(newUserVector)
            await this.userEmbeddingService.updateEmbedding(
                this.getVectorValues(userEmbedding),
                interaction
            )
        } catch (error) {
            this.logger.error("Erro ao atualizar embeddings", {
                error,
                interactionId: interaction.id,
            })
        }
    }

    /**
     * Calcula a força da interação com base no tipo
     * @param interaction A interação a ser analisada
     * @returns Valor numérico representando a força da interação
     */
    private getInteractionStrength(interaction: UserInteraction): number {
        const baseStrength = this.interactionStrengths.get(interaction.type) || 0.2

        if (interaction.metadata) {
            let adjustedStrength = baseStrength

            if (interaction.metadata.engagementTime) {
                const engagementTime = interaction.metadata.engagementTime

                if (baseStrength > 0) {
                    if (engagementTime > Params.feedback.engagement.timeThresholds.long) {
                        adjustedStrength *= Params.feedback.engagement.timeMultipliers.long
                    } else if (engagementTime < Params.feedback.engagement.timeThresholds.short) {
                        adjustedStrength *= Params.feedback.engagement.timeMultipliers.short
                    }
                }
            }

            if (interaction.metadata.percentWatched) {
                const percentWatched = interaction.metadata.percentWatched

                if (percentWatched > Params.feedback.engagement.watchPercentages.high) {
                    adjustedStrength *= Params.feedback.engagement.watchMultipliers.high
                } else if (percentWatched < Params.feedback.engagement.watchPercentages.low) {
                    adjustedStrength *= Params.feedback.engagement.watchMultipliers.low
                }
            }

            return adjustedStrength
        }

        return baseStrength
    }

    private getVectorDimension(embedding: any): number {
        // Handle different possible structures
        if (embedding.vector && embedding.vector.dimension) {
            return embedding.vector.dimension
        }
        if (embedding.dimensions) {
            return embedding.dimensions
        }
        if (embedding.vector && embedding.vector.values) {
            return embedding.vector.values.length
        }
        if (embedding.values) {
            return embedding.values.length
        }
        // Default fallback
        return 128
    }

    private getVectorValues(embedding: any): number[] {
        // Handle different possible structures
        if (embedding.vector && embedding.vector.values) {
            return embedding.vector.values
        }
        if (embedding.values) {
            return embedding.values
        }
        // Default fallback - empty vector
        return []
    }
}
