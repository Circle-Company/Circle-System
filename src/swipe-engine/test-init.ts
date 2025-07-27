import { initializeRecommendationSystem, getRecommendations } from "./services"
import { RecommendationOptions, RecommendationContext } from "./core/types"
import { getLogger } from "./core/utils/logger"
import { connection } from "../database"

const logger = getLogger("TestInit")

async function testRecommendationSystem() {
    try {
        // Verificar conexão com o banco
        await connection.authenticate()
        logger.info("Conexão com o banco de dados estabelecida")

        // Inicializar o sistema
        initializeRecommendationSystem()
        logger.info("Sistema de recomendação inicializado")

        // Testar recomendações com diferentes contextos
        const testCases = [
            {
                name: "Recomendações padrão",
                userId: process.env.TEST_USER_ID || "1",
                options: {} as RecommendationOptions,
            },
            {
                name: "Recomendações com alta diversidade",
                userId: process.env.TEST_USER_ID || "1",
                options: {
                    diversity: 0.8,
                    novelty: 0.2,
                } as RecommendationOptions,
            },
            {
                name: "Recomendações com contexto de horário de pico",
                userId: process.env.TEST_USER_ID || "1",
                options: {
                    context: {
                        timeOfDay: 18, // 18:00 - horário de pico
                        dayOfWeek: 1, // Segunda-feira
                    } as RecommendationContext,
                } as RecommendationOptions,
            },
            {
                name: "Recomendações com contexto de fim de semana",
                userId: process.env.TEST_USER_ID || "1",
                options: {
                    context: {
                        timeOfDay: 14, // 14:00 - meio da tarde
                        dayOfWeek: 6, // Sábado
                    } as RecommendationContext,
                } as RecommendationOptions,
            },
        ]

        // Executar testes
        for (const testCase of testCases) {
            logger.info(`Executando teste: ${testCase.name}`)
            const recommendations = await getRecommendations(
                testCase.userId,
                testCase.options
            )

            logger.info(`Resultados para ${testCase.name}:`, {
                totalRecommendations: recommendations.length,
                firstRecommendation: recommendations[0],
                diversity: testCase.options.diversity || "padrão",
                context: testCase.options.context || "nenhum",
            })
        }

        // Testar processamento de interações
        if (process.env.TEST_INTERACTIONS === "true") {
            logger.info("Testando processamento de interações")
            // Aqui você pode adicionar testes de interação se necessário
        }

        logger.info("Testes concluídos com sucesso")
    } catch (error) {
        logger.error("Erro durante os testes:", error)
        process.exit(1)
    } finally {
        await connection.close()
    }
}

// Executar testes se a variável de ambiente TEST_RECOMMENDATION estiver definida
if (process.env.TEST_RECOMMENDATION === "true") {
    testRecommendationSystem()
}

export { testRecommendationSystem } 