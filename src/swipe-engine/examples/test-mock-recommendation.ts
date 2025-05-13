import { RecommendationEngine } from "../core/recommendation/RecommendationEngine"
import { FeedbackProcessor } from "../core/feedback/FeedbackProcessor"
import { mockPosts, mockInteractions, mockUserProfile } from "../data/mock-posts"
import { getLogger } from "../core/utils/logger"
import { UserEmbeddingService } from "../core/embeddings/UserEmbeddingService"
import { RankingService } from "../core/recommendation/RankingService"
import { PostEmbeddingService } from "../core/embeddings/PostEmbeddingService"
import { UserInteraction, InteractionType, UserEmbedding } from "../core/types"
import { v4 as uuidv4 } from "uuid"

const logger = getLogger("test-mock-recommendation")

async function testMockRecommendation() {
    try {
        // Inicializar serviços necessários
        logger.info("Inicializando serviços...")
        const userEmbeddingService = new UserEmbeddingService(
            128,
            "models/user_embedding_model",
            {
                findByUserId: async (userId, limit) => {
                    return mockInteractions
                        .filter(i => i.userId === userId.toString())
                        .map(i => ({
                            id: uuidv4(),
                            userId: BigInt(i.userId),
                            entityId: BigInt(i.entityId),
                            entityType: "post",
                            type: i.type as InteractionType,
                            timestamp: i.timestamp,
                            metadata: i.metadata
                        }))
                },
            },
            {
                findByUserId: async (userId) => {
                    const post = mockPosts.find(p => p.user_id === userId.toString())
                    if (!post?.embedding) return null
                    return {
                        userId: BigInt(userId),
                        embedding: post.embedding.vector.values,
                        lastUpdated: new Date(),
                        version: 1,
                        metadata: post.embedding.metadata
                    }
                },
                saveOrUpdate: async (data) => {
                    logger.info(`Atualizando embedding para usuário ${data.userId}`)
                }
            }
        )

        const postEmbeddingService = new PostEmbeddingService(
            128,
            "models/post_embedding_model",
            {
                findById: async (postId) => {
                    const post = mockPosts.find(p => p.id === postId.toString())
                    return post || null
                },
                findRecentPostIds: async (limit) => {
                    return mockPosts.slice(0, limit).map(p => BigInt(p.id))
                }
            },
            {
                findByPostId: async (postId) => {
                    const post = mockPosts.find(p => p.id === postId.toString())
                    if (!post?.embedding) return null
                    return {
                        postId: BigInt(postId),
                        embedding: post.embedding.vector.values,
                        lastUpdated: new Date(),
                        version: 1,
                        metadata: post.embedding.metadata
                    }
                },
                saveOrUpdate: async (data) => {
                    logger.info(`Atualizando embedding para post ${data.postId}`)
                }
            }
        )

        // Inicializar o sistema
        logger.info("Inicializando sistema de recomendação...")
        const recommendationEngine = new RecommendationEngine({
            userEmbeddingService,
            rankingService: new RankingService()
        })
        const feedbackProcessor = new FeedbackProcessor(
            userEmbeddingService,
            postEmbeddingService,
            logger,
            10
        )

        // Simular interações do usuário
        logger.info("Simulando interações do usuário...")
        for (const interaction of mockInteractions) {
            const userInteraction: UserInteraction = {
                id: uuidv4(),
                userId: BigInt(interaction.userId),
                entityId: BigInt(interaction.entityId),
                entityType: "post",
                type: interaction.type as InteractionType,
                timestamp: interaction.timestamp,
                metadata: interaction.metadata
            }
            await feedbackProcessor.processInteraction(userInteraction)
            logger.info(`Processada interação: ${interaction.type} no post ${interaction.entityId}`)
        }

        // Gerar recomendações
        logger.info("Gerando recomendações...")
        const recommendations = await recommendationEngine.getRecommendations(
            BigInt(mockUserProfile.userId),
            5,
            {
                context: {
                    timeOfDay: new Date().getHours(),
                    dayOfWeek: new Date().getDay(),
                    location: mockUserProfile.demographics?.location || "unknown",
                },
            }
        )

        // Exibir resultados
        logger.info("Resultados das recomendações:")
        recommendations.forEach((rec, index) => {
            const post = mockPosts.find((p) => p.id === rec.entityId.toString())
            if (post) {
                logger.info(
                    `${index + 1}. Post ${post.id} (${post.tags?.join(", ") || "sem tags"}) - Score: ${rec.score.toFixed(2)}`
                )
            }
        })

        // Verificar histórico de interações
        logger.info("\nVerificando histórico de interações...")
        const interactionHistory = await feedbackProcessor.getUserInteractionHistory(
            BigInt(mockUserProfile.userId),
            100,
            0
        )
        logger.info(`Total de interações: ${interactionHistory.length}`)
        interactionHistory.forEach((interaction) => {
            logger.info(
                `- ${interaction.interactionType} no post ${interaction.entityId} em ${interaction.interactionDate.toISOString()}`
            )
        })

        // Verificar resumo de interações
        logger.info("\nVerificando resumo de interações...")
        const interactionSummary = await feedbackProcessor.getUserInteractionSummary(
            mockUserProfile.userId
        )
        logger.info("Resumo de interações:", interactionSummary)

    } catch (error) {
        logger.error("Erro durante o teste:", error)
    }
}

// Executar o teste
testMockRecommendation()
    .then(() => {
        logger.info("Teste concluído com sucesso!")
        process.exit(0)
    })
    .catch((error) => {
        logger.error("Erro fatal durante o teste:", error)
        process.exit(1)
    }) 