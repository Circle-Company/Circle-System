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
import Cluster from "./models/Cluster"
import InteractionEvent from "./models/InteractionEvent"
import PostCluster from "./models/PostCluster"
import PostClusterRank from "./models/PostClusterRank"
import PostEmbedding from "./models/PostEmbedding"
import UserClusterRank from "./models/UserClusterRank"
import UserEmbedding from "./models/UserEmbedding"

// Exportações públicas
export {
    Cluster,
    ClusterInfo,
    DBSCANClustering,
    DBSCANConfig,
    initializeModels,
    InteractionEvent,
    performClustering,
    PostCluster,
    PostClusterRank,
    PostEmbedding,
    Recommendation,
    RecommendationEngine,
    RecommendationOptions,
    trainClusteringModel,
    UserClusterRank,
    UserEmbedding,
    UserProfile,
}

// Função para criar uma instância do SwipeEngine
export function createSwipeEngine(config?: any) {
    return new RecommendationEngine(config)
}

// Inicializar modelos
const initializeModels = () => {
    // Inicializar modelos
    Cluster.initialize(connection)
    UserEmbedding.initialize(connection)
    PostEmbedding.initialize(connection)
    UserClusterRank.initialize(connection)
    InteractionEvent.initialize(connection)
    PostCluster.initialize(connection)
    PostClusterRank.initialize(connection)

    // Associações
    Cluster.associate(connection.models)
    UserEmbedding.associate(connection.models)
    PostEmbedding.associate(connection.models)
    UserClusterRank.associate(connection.models)
    InteractionEvent.associate(connection.models)
    PostCluster.associate(connection.models)
    PostClusterRank.associate(connection.models)
}
