/**
 * Swipe Engine v2 - Motor de recomendação baseado em SimClusters
 *
 * Este é o ponto de entrada para o motor de recomendação,
 * que usa o algoritmo KMeans para clustering e geração de recomendações.
 */

import { KMeansClustering } from "./core/clustering"
import { PostEmbeddingService } from "./core/embeddings/PostEmbeddingService"
import { UserEmbeddingService } from "./core/embeddings/UserEmbeddingService"
import { RecommendationEngine } from "./core/recommendation/RecommendationEngine"
import { configureLogger, getLogger, Logger, LogLevel } from "./core/utils/logger"

// Exportamos componentes principais
export {
    configureLogger,
    getLogger,
    KMeansClustering,
    Logger,
    LogLevel,
    PostEmbeddingService,
    RecommendationEngine,
    UserEmbeddingService,
}

/**
 * Cria uma instância do motor de recomendação com as configurações padrão ou personalizadas
 * @param options Opções de configuração
 * @returns Instância configurada do motor de recomendação
 */
export function createSwipeEngine(options: SwipeEngineOptions = {}): RecommendationEngine {
    // Configurações padrão
    const {
        embeddingDimension = 128,
        modelPath = "models/default",
        userRepository = null,
        interactionRepository = null,
        userEmbeddingRepository = null,
    } = options

    // Criar serviço de embedding de usuário
    const userEmbeddingService = new UserEmbeddingService(
        embeddingDimension,
        modelPath + "/user_model",
        userRepository,
        interactionRepository,
        userEmbeddingRepository
    )

    // Criar motor de recomendação usando o serviço de embedding
    const engine = new RecommendationEngine(userEmbeddingService)

    // Configurar logger se fornecido
    if (options.loggerConfig) {
        configureLogger(options.loggerConfig)
    }

    return engine
}

/**
 * Opções de configuração para o motor de recomendação
 */
export interface SwipeEngineOptions {
    // Dimensão dos embeddings
    embeddingDimension?: number

    // Caminho para o modelo de embedding
    modelPath?: string

    // Repositórios (serão substituídos pelos tipos reais quando implementados)
    userRepository?: any
    interactionRepository?: any
    userEmbeddingRepository?: any

    // Opções de configuração do motor de recomendação
    recommendationOptions?: {
        defaultNumClusters?: number
        cacheExpiration?: number
        diversityLevel?: number
    }

    // Configuração do logger
    loggerConfig?: {
        minLevel?: LogLevel
        showTimestamp?: boolean
        showComponent?: boolean
    }
}
