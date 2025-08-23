/**
 * SwipeEngine v2 - Motor de recomendação baseado em embeddings
 *
 * Exportação principal para o motor de recomendação do Circle
 * que usa o algoritmo DBSCAN para clustering e geração de recomendações.
 */

import { ClusterInfo, Recommendation, RecommendationOptions, UserProfile } from "./core/types"

import { connection } from "../database"
import { RecommendationEngine } from "./core/recommendation/RecommendationEngine"
import InteractionEvent from "./models/InteractionEvent"
import PostCluster from "./models/PostCluster"
import PostClusterRank from "./models/PostClusterRank"
import PostEmbedding from "./models/PostEmbedding"
import UserEmbedding from "./models/UserEmbedding"
import UserInteractionHistory from "./models/UserInteractionHistory"
import UserInteractionSummary from "./models/UserInteractionSummary"

// Exportações públicas
export {
    ClusterInfo,
    InteractionEvent,
    PostCluster,
    PostClusterRank,
    PostEmbedding,
    Recommendation,
    RecommendationOptions,
    UserEmbedding,
    UserInteractionHistory,
    UserInteractionSummary,
    UserProfile,
}

// Função para criar uma instância do SwipeEngine
export function createSwipeEngine(config?: any) {
    return new RecommendationEngine(config)
}

// Inicialização
export const initializeModels = () => {
    // Inicializar modelos
    UserEmbedding.initialize(connection)
    PostEmbedding.initialize(connection)
    PostCluster.initialize(connection)
    PostClusterRank.initialize(connection)
    InteractionEvent.initialize(connection)
    UserInteractionHistory.initialize(connection)
    UserInteractionSummary.initialize(connection)

    // Associações
    UserEmbedding.associate(connection.models)
    PostEmbedding.associate(connection.models)
    PostCluster.associate(connection.models)
    PostClusterRank.associate(connection.models)
    UserInteractionHistory.associate(connection.models)
    UserInteractionSummary.associate(connection.models)
    InteractionEvent.associate(connection.models)
}
