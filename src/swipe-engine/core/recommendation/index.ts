/**
 * Exportações do módulo de recomendação
 */

import { ClusterMatcher } from "./ClusterMatcher"
import { RecommendationEngine } from "./RecommendationEngine"

export { ClusterMatcher, RecommendationEngine }

// Função para criação fácil de instâncias de ClusterMatcher
export function createClusterMatcher(
    clusters: any[],
    options?: {
        minMatchThreshold?: number
        contextWeight?: number
        interestWeight?: number
        embeddingWeight?: number
        maxClusters?: number
    }
) {
    return new ClusterMatcher(clusters, options)
}
