import { Op } from "sequelize"
import { connection } from "../../../database"
import Moment from "../../../models/moments/moment-model"
import InteractionEvent from "../../models/InteractionEvent"
import PostCluster from "../../models/PostCluster"
import PostEmbedding from "../../models/PostEmbedding"
import UserClusterRank from "../../models/UserClusterRank"
import UserEmbedding from "../../models/UserEmbedding"
import { PostEmbeddingBuilder } from "../embeddings/builders/PostEmbeddingBuilder"
import { UserEmbeddingService } from "../embeddings/UserEmbeddingService"
import { InteractionType, PostEmbeddingProps, Recommendation, RecommendationOptions } from "../types"
import { getLogger } from "../utils/logger"
import { RankingService } from "./RankingService"
import { RecommendationEngine } from "./RecommendationEngine"

/**.
 * Coordenador principal que gerencia o fluxo completo de recomendação
 * desde o processamento de entrada até a geração de recomendações
 */
export class RecommendationCoordinator {
    private readonly engine: RecommendationEngine
    private readonly userEmbeddingService: UserEmbeddingService
    private readonly postEmbeddingBuilder: PostEmbeddingBuilder
    private readonly rankingService: RankingService
    private readonly logger = getLogger("RecommendationCoordinator")

    constructor() {
        // Inicializa os componentes necessários
        this.userEmbeddingService = new UserEmbeddingService(
            128,
            "models/user_embedding_model",
            {
                findByUserId: async (userId, limit) => {
                    const events = await InteractionEvent.findAll({
                        where: { userId: userId.toString() },
                        limit: limit || 100,
                        order: [["timestamp", "DESC"]],
                    })

                    // Converter eventos para o formato UserInteraction
                    return events.map((event) => ({
                        id: event.id.toString(),
                        userId: BigInt(event.userId),
                        entityId: BigInt(event.entityId),
                        entityType: event.entityType,
                        type: event.type,
                        timestamp: event.timestamp,
                        metadata: event.metadata,
                    }))
                },
            },
            {
                findByUserId: async (userId) => {
                    const embedding = await UserEmbedding.findOne({
                        where: { userId: userId.toString() },
                    })
                    return embedding
                        ? {
                              userId,
                              embedding: JSON.parse(embedding.vector).values || [],
                              lastUpdated: embedding.updatedAt,
                              version: 1, // Versão padrão
                              metadata: embedding.metadata,
                          }
                        : null
                },
                saveOrUpdate: async (data) => {
                    const vectorData = JSON.stringify({
                        values: data.embedding,
                        dimension: data.embedding.length,
                    })

                    await UserEmbedding.upsert({
                        userId: data.userId.toString(),
                        vector: vectorData,
                        dimension: data.embedding.length,
                        metadata: data.metadata || {},
                    })
                },
            }
        )
        this.postEmbeddingBuilder = new PostEmbeddingBuilder()
        this.rankingService = new RankingService()

        // Inicializa o motor de recomendação com todos os componentes necessários
        this.engine = new RecommendationEngine({
            userEmbeddingService: this.userEmbeddingService,
            rankingService: this.rankingService,
        })

        this.logger.info("Coordenador de recomendação inicializado")
    }

    /**
     * Gera recomendações para um usuário com base em seu perfil e contexto
     * @param userId ID do usuário
     * @param options Opções de configuração para a recomendação
     * @returns Lista de recomendações
     */
    public async getRecommendations(
        userId: string | bigint,
        options: RecommendationOptions = {}
    ): Promise<Recommendation[]> {
        try {
            this.logger.info(`Gerando recomendações para usuário ${userId}`)

            // 1. Verificar se o usuário possui embedding; se não, criar
            await this.ensureUserEmbedding(userId)

            // 2. Obter recomendações através do motor principal
            const recommendations = await this.engine.getRecommendations(
                userId,
                options.limit || 20,
                options
            )

            return recommendations
        } catch (error: any) {
            this.logger.error(`Erro ao gerar recomendações: ${error.message}`)
            return []
        }
    }

    /**
     * Processa interações de usuário para melhorar recomendações futuras
     * @param userId ID do usuário que realizou a interação
     * @param entityId ID da entidade com a qual o usuário interagiu
     * @param type Tipo de interação (view, like, dislike, etc)
     * @param metadata Dados adicionais sobre a interação
     */
    public async processInteraction(
        userId: string | bigint,
        entityId: string | bigint,
        type: InteractionType,
        metadata: Record<string, any> = {}
    ): Promise<void> {
        try {
            // Converter para BigInt se for uma string
            const userIdBigInt = typeof userId === "string" ? BigInt(userId) : userId
            const entityIdBigInt = typeof entityId === "string" ? BigInt(entityId) : entityId

            // Registrar a interação para feedback e análise
            await InteractionEvent.create({
                userId: userIdBigInt.toString(),
                entityId: entityIdBigInt.toString(),
                entityType: "post", // Por enquanto, apenas posts são suportados
                type,
                timestamp: new Date(),
                metadata,
            })

            // Se for uma interação significativa, atualiza o embedding do usuário
            if (type === "like" || type === "dislike" || type === "like_comment") {
                this.logger.debug(`Agendando atualização de embedding para usuário ${userId}`)
                // Em produção, isso seria colocado em uma fila para processamento assíncrono
                // Exemplo: this.updateQueue.add({ userId, priority: type === 'like' ? 'high' : 'normal' })

                // Para nosso exemplo, executamos diretamente
                await this.updateUserEmbedding(userIdBigInt)
            }

            this.logger.info(`Interação ${type} processada para usuário ${userId}`)
        } catch (error: any) {
            this.logger.error(`Erro ao processar interação: ${error.message}`)
            throw error
        }
    }

    /**
     * Garante que um usuário tenha um embedding
     */
    private async ensureUserEmbedding(userId: string | bigint): Promise<void> {
        try {
            const embedding = await UserEmbedding.findOne({
                where: { userId: userId.toString() },
            })

            if (!embedding) {
                this.logger.info(`Criando embedding para usuário ${userId}`)
                await this.userEmbeddingService.generateUserEmbedding(BigInt(userId.toString()))
            }
        } catch (error: any) {
            this.logger.error(`Erro ao verificar embedding do usuário: ${error.message}`)
        }
    }

    /**
     * Atualiza os rankings dos clusters para um usuário com base em interação
     */
    private async updateUserClusterRanks(
        userId: string | bigint,
        postId: string | bigint,
        interactionType: InteractionType
    ): Promise<void> {
        try {
            // 1. Encontrar clusters aos quais o post pertence
            const postClusters = await PostCluster.findAll({
                where: {
                    memberIds: {
                        [Op.contains]: [postId.toString()],
                    },
                },
            })

            if (!postClusters.length) return

            // 2. Para cada cluster, atualizar o ranking do usuário
            for (const cluster of postClusters) {
                // Verificar se já existe um ranking para este usuário e cluster
                let userClusterRank = await UserClusterRank.findOne({
                    where: {
                        userId: userId.toString(),
                        clusterId: cluster.id,
                    },
                })

                // Calcular score de interação baseado no tipo
                let interactionBoost = 0
                switch (interactionType) {
                    case "like":
                        interactionBoost = 0.5
                        break
                    case "share":
                        interactionBoost = 0.8
                        break
                    case "long_view":
                        interactionBoost = 0.3
                        break
                    case "comment":
                        interactionBoost = 0.6
                        break
                    case "dislike":
                        interactionBoost = -0.5
                        break
                    case "report":
                        interactionBoost = -1.0
                        break
                    default:
                        interactionBoost = 0.1
                }

                if (userClusterRank) {
                    // Atualizar ranking existente
                    const newInteractionScore = Math.min(
                        1.0,
                        userClusterRank.interactionScore + interactionBoost * 0.2
                    )

                    await userClusterRank.update({
                        interactionScore: newInteractionScore,
                        score: (newInteractionScore + userClusterRank.matchScore) / 2,
                        lastInteractionDate: new Date(),
                    })
                } else {
                    // Criar novo ranking
                    await UserClusterRank.create({
                        userId: userId.toString(),
                        clusterId: cluster.id,
                        score: interactionBoost > 0 ? 0.3 : 0,
                        similarity: 0.3,
                        interactionScore: interactionBoost > 0 ? 0.3 : 0,
                        matchScore: 0.3,
                        isActive: true,
                        lastInteractionDate: new Date(),
                    })
                }
            }
        } catch (error: any) {
            this.logger.error(`Erro ao atualizar rankings de cluster: ${error.message}`)
        }
    }

    /**
     * Atualiza o embedding do usuário
     */
    private async updateUserEmbedding(userId: string | bigint): Promise<void> {
        try {
            await this.userEmbeddingService.generateUserEmbedding(BigInt(userId.toString()))
        } catch (error: any) {
            this.logger.error(`Erro ao atualizar embedding do usuário: ${error.message}`)
        }
    }

    /**
     * Cria/atualiza o embedding para um post
     */
    public async processNewPost(postId: string | bigint): Promise<void> {
        try {
            this.logger.info(`Processando novo post ${postId}`)

            // 1. Buscar dados do post com suas associações
            const post = await Moment.findByPk(postId, {
                include: [{
                    association: 'tags',
                    attributes: ['title']
                }]
            })
            if (!post) {
                throw new Error(`Post ${postId} não encontrado`)
            }

            // 2. Gerar embedding com validações de tipo
            const description = post.getDataValue('description') as string | null
            const userId = post.getDataValue('user_id') as bigint
            const createdAt = post.createdAt // Usando o campo createdAt gerado automaticamente pelo Sequelize

            // Extrair títulos das tags
            const tagTitles = (post as any).tags?.map((tag: any) => tag.getDataValue('title')) || []

            const postData: PostEmbeddingProps = {
                textContent: description || '',
                tags: tagTitles,
                engagementMetrics: {
                    views: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    saves: 0,
                    engagementRate: 0
                },
                authorId: userId,
                createdAt: createdAt
            }
            await this.postEmbeddingBuilder.build(postData)

            // 3. Associar a clusters (em produção seria um job em background)
            await this.assignPostToClusters(postId)
        } catch (error: any) {
            this.logger.error(`Erro ao processar novo post: ${error.message}`)
        }
    }

    /**
     * Atribui um post a clusters apropriados
     */
    private async assignPostToClusters(postId: string | bigint): Promise<void> {
        try {
            // 1. Obter embedding do post
            const postEmbeddingRecord = await PostEmbedding.findOne({
                where: { postId: postId.toString() },
            })

            if (!postEmbeddingRecord) {
                throw new Error(`Embedding para post ${postId} não encontrado`)
            }

            // 2. Obter todos os clusters
            const clusters = await PostCluster.findAll()
            if (!clusters.length) return

            // 3. Calcular similaridade com cada cluster e atribuir aos mais relevantes
            const postEmbedding = postEmbeddingRecord.toPostEmbeddingType()
            const vectorValues = postEmbedding.vector.values

            for (const cluster of clusters) {
                const clusterInfo = cluster.toClusterInfo()
                const centroidValues = clusterInfo.centroid.values

                // Calcular similaridade usando similaridade de cosseno
                const similarity = this.calculateCosineSimilarity(vectorValues, centroidValues)

                // Se similaridade for alta o suficiente, associar post ao cluster
                if (similarity > 0.5) {
                    // 1. Atualizar lista de membros do cluster
                    const memberIds = cluster.memberIds || []
                    if (!memberIds.includes(postId.toString())) {
                        await cluster.update({
                            memberIds: [...memberIds, postId.toString()],
                            size: memberIds.length + 1,
                        })
                    }

                    // 2. Criar/atualizar registro de rank
                    await this.createOrUpdatePostClusterRank(postId, cluster.id, similarity)
                }
            }
        } catch (error: any) {
            this.logger.error(`Erro ao associar post a clusters: ${error.message}`)
        }
    }

    /**
     * Cria ou atualiza o registro de ranking entre post e cluster
     */
    private async createOrUpdatePostClusterRank(
        postId: string | bigint,
        clusterId: string,
        similarity: number
    ): Promise<void> {
        try {
            // Buscar registro existente
            const existingRank = await connection.models.PostClusterRank.findOne({
                where: {
                    postId: postId.toString(),
                    clusterId,
                },
            })

            if (existingRank) {
                // Atualizar registro existente
                await existingRank.update({
                    similarity,
                    score: similarity,
                    relevanceScore: similarity,
                    lastUpdated: new Date(),
                })
            } else {
                // Criar novo registro
                await connection.models.PostClusterRank.create({
                    postId: postId.toString(),
                    clusterId,
                    similarity,
                    score: similarity,
                    relevanceScore: similarity,
                    engagementScore: 0,
                    isActive: true,
                    lastUpdated: new Date(),
                })
            }
        } catch (error: any) {
            this.logger.error(`Erro ao criar/atualizar ranking post-cluster: ${error.message}`)
        }
    }

    /**
     * Calcula a similaridade de cosseno entre dois vetores
     */
    private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
        try {
            if (vectorA.length !== vectorB.length) {
                throw new Error("Vetores devem ter o mesmo tamanho")
            }

            let dotProduct = 0
            let normA = 0
            let normB = 0

            for (let i = 0; i < vectorA.length; i++) {
                dotProduct += vectorA[i] * vectorB[i]
                normA += vectorA[i] * vectorA[i]
                normB += vectorB[i] * vectorB[i]
            }

            if (normA === 0 || normB === 0) return 0

            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
        } catch (error) {
            this.logger.error("Erro ao calcular similaridade de cosseno")
            return 0
        }
    }
}
