/**
 * SwipeEngine v2 - Motor de recomendação baseado em embeddings
 *
 * Exportação principal para o motor de recomendação do Circle
 * que usa o algoritmo DBSCAN para clustering e geração de recomendações.
 */

import { connection } from "../database"
import {
    DBSCANClustering,
    DBSCANConfig,
    performClustering,
    trainClusteringModel,
} from "./core/clustering"
import { RecommendationEngine } from "./core/recommendation/RecommendationEngine"
import { ClusterInfo, Recommendation, RecommendationOptions, UserProfile } from "./core/types"
import PostCluster from "./models/PostCluster"
import PostClusterRank from "./models/PostClusterRank"
import PostEmbedding from "./models/PostEmbedding"
import UserEmbedding from "./models/UserEmbedding"
import UserInteractionHistory from "./models/UserInteractionHistory"
import UserInteractionSummary from "./models/UserInteractionSummary"
import InteractionEvent from "./models/InteractionEvent"

// Exportações públicas
export {
    Recommendation,
    RecommendationOptions,
    UserProfile,
    ClusterInfo,
    PostCluster,
    PostClusterRank,
    PostEmbedding,
    UserEmbedding,
    UserInteractionHistory,
    UserInteractionSummary,
    InteractionEvent
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
