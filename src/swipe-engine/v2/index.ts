/**
 * SwipeEngine v2 - Motor de recomendação baseado em embeddings
 *
 * Exportação principal para o motor de recomendação do Circle
 * que usa o algoritmo DBSCAN para clustering e geração de recomendações.
 */

import {
    DBSCANClustering,
    DBSCANConfig,
    performClustering,
    trainClusteringModel,
} from "./core/clustering"
import { RecommendationEngine } from "./core/recommendation/RecommendationEngine"
import { ClusterInfo, Recommendation, RecommendationOptions, UserProfile } from "./core/types"

// Exportações públicas
export {
    ClusterInfo,
    DBSCANClustering,
    DBSCANConfig,
    performClustering,
    Recommendation,
    RecommendationEngine,
    RecommendationOptions,
    trainClusteringModel,
    UserProfile,
}

// Função para criar uma instância do SwipeEngine
export function createSwipeEngine(config?: any) {
    return new RecommendationEngine(config)
}
