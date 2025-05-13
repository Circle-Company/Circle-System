import { initializeRecommendationSystem } from "./services"
import { testPostClustering } from "./examples/test-post-clustering"
import { getLogger } from "./core/utils/logger"

const logger = getLogger("SwipeEngineInit")

/**
 * Inicializa o SwipeEngine V2 e executa testes iniciais
 */
export async function initSwipeEngineV2() {
    try {
        // Inicializar modelos do banco de dados
        logger.info("Inicializando modelos do banco de dados...")

        // Inicializar sistema de recomendação
        logger.info("Inicializando sistema de recomendação...")
        initializeRecommendationSystem()

        // Executar teste de clustering com posts mockados
        logger.info("Executando teste de clustering com posts mockados...")
        await testPostClustering()

        logger.info("✅ SwipeEngine V2 inicializado com sucesso!")
    } catch (error) {
        logger.error("❌ Erro ao inicializar SwipeEngine V2:", error)
        throw error // Propagar o erro para que a aplicação saiba que houve falha na inicialização
    }
} 