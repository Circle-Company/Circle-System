import { InteractionType, UserEmbedding, UserInteraction } from "../core/types"
import { mockInteractions, mockPosts, mockUserProfile } from "../data/mock-posts"

import { FeedbackProcessor } from "../core/feedback/FeedbackProcessor"
import { PostEmbeddingService } from "../core/embeddings/PostEmbeddingService"
import { RankingService } from "../core/recommendation/RankingService"
import { RecommendationEngine } from "../core/recommendation/RecommendationEngine"
import { UserEmbeddingService } from "../core/embeddings/UserEmbeddingService"
import { getLogger } from "../core/utils/logger"
import { v4 as uuidv4 } from "uuid"

const logger = getLogger("test-mock-recommendation")

export async function testMockRecommendation() {
    try {
        // Inicializar serviços necessários
        logger.info("Inicializando serviços...")
        const userEmbeddingService = new UserEmbeddingService(128)

        const postEmbeddingService = new PostEmbeddingService(128)

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

        // Formatar recomendações como feed
        const feedRecommendations = await Promise.all(recommendations.map(async (rec, index) => {
            const post = mockPosts.find((p) => p.id === rec.entityId.toString())
            if (!post) return null

            // Buscar embedding do post para análise de similaridade
            const postEmbedding = await postEmbeddingService.getPostEmbedding(BigInt(post.id))
            
            // Buscar posts similares para contexto
            const similarPosts = await postEmbeddingService.findSimilarPosts(
                BigInt(post.id),
                3,
                0.5
            )

            return {
                id: post.id,
                type: "post",
                score: rec.score,
                rank: index + 1,
                content: {
                    tags: post.tags || [],
                    location: post.location,
                    created_at: post.created_at
                },
                author: {
                    id: post.user_id,
                    statistics: post.statistics || {
                        likes: 0,
                        comments: 0,
                        shares: 0,
                        views: 0
                    }
                },
                engagement: {
                    likes: post.statistics?.likes || 0,
                    comments: post.statistics?.comments || 0,
                    shares: post.statistics?.shares || 0,
                    views: post.statistics?.views || 0
                },
                metadata: {
                    similarity_score: rec.score,
                    embedding_version: postEmbedding.metadata?.version || 1,
                    content_topics: postEmbedding.metadata?.contentTopics || [],
                    interests: post.embedding?.metadata?.interests || [],
                    similar_posts: similarPosts.map(sp => ({
                        id: sp.id.toString(),
                        similarity: sp.similarity
                    }))
                }
            }
        }))

        // Exibir feed em formato JSON
        logger.info("\nFeed de Recomendações:")
        logger.info(JSON.stringify({
            user_id: mockUserProfile.userId,
            generated_at: new Date().toISOString(),
            context: {
                time_of_day: new Date().getHours(),
                day_of_week: new Date().getDay(),
                location: mockUserProfile.demographics?.location
            },
            recommendations: feedRecommendations.filter(r => r !== null),
            pagination: {
                total: recommendations.length,
                page: 1,
                limit: 5
            }
        }, null, 2))

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