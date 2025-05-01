/**
 * Configuração para o algoritmo de clustering
 */
export interface ClusterConfig {
    /**
     * Número de clusters a serem formados (para alguns algoritmos como K-Means)
     */
    k?: number // Número de clusters (para K-means)
    /**
     * Distância máxima para considerar pontos conectados (raio de vizinhança no DBSCAN)
     */
    epsilon?: number // Raio da vizinhança (para DBSCAN)
    /**
     * Número mínimo de pontos necessários para formar um cluster no DBSCAN
     */
    minPoints?: number // Pontos mínimos para formar um cluster (para DBSCAN)
    /**
     * Peso relativo de diferentes características no cálculo de distância
     */
    weights?: Record<string, number>
    /**
     * Número máximo de iterações para o algoritmo
     */
    maxIterations?: number // Número máximo de iterações (para K-means)
    randomSeed?: number // Semente aleatória para inicialização dos centroides
    initMethod?: string // Método de inicialização dos centroides
    threshold?: number // Limiar de convergência
}

/**
 * Métricas de avaliação para clusters
 */
export interface ClusterMetrics {
    /**
     * Medida de quão próximos os pontos estão dentro do cluster (0-1)
     */
    cohesion: number

    /**
     * Medida de quão bem o cluster está separado de outros clusters
     */
    separation: number

    /**
     * Proporção de pontos no cluster em relação ao total
     */
    density: number
}

export interface Vector {
    dimensions: number
    values: number[]
}

export interface UserEmbedding {
    userId: string
    vector: number[]
    timestamp: Date
    version: string
}

export interface PostEmbedding {
    postId: string
    vector: number[]
    timestamp: Date
    version: string
}

export interface ClusterInfo {
    id: string
    name: string
    centroid: number[]
    members: string[]
    radius: number
    density: number
    topics?: string[]
    activeTimeOfDay?: string[]
    geographicFocus?: string
    dominantLanguages?: string[]
    metrics?: ClusterMetrics
    createdAt: Date
    updatedAt: Date
}

export interface MatchResult {
    clusterId: string
    clusterName: string
    similarity: number
    cluster: ClusterInfo
}

export interface UserProfile {
    userId: string
    interests?: string[]
    language?: string
    activityLevel?: "low" | "medium" | "high"
    engagementPatterns?: {
        postsPerDay?: number
        commentsPerDay?: number
        likesPerDay?: number
    }
    topicPreferences?: Map<string, number>
}

export interface RecommendationContext {
    timeOfDay?: "morning" | "afternoon" | "evening" | "night"
    dayOfWeek?: number
    location?: string
    deviceType?: "mobile" | "desktop" | "tablet"
    sessionDuration?: number
}

export interface ClusteringOptions {
    minClusters?: number
    maxClusters?: number
    distanceMetric?: "euclidean" | "cosine" | "manhattan"
    maxIterations?: number
    convergenceThreshold?: number
    randomSeed?: number
}

export interface ClusteringResult {
    clusters: ClusterInfo[]
    iterations: number
    converged: boolean
    executionTimeMs: number
    quality: {
        silhouetteScore?: number
        daviesBouldinIndex?: number
        dunn?: number
    }
}

/**
 * Interface para representar um vetor de embedding
 */
export interface EmbeddingVector {
    dimension: number
    values: number[]
    createdAt: Date
    updatedAt: Date
}

/**
 * Configuração para algoritmos de clustering
 */
export interface ClusteringConfig {
    numClusters: number
    maxIterations: number
    convergenceThreshold: number
    outlierStrategy: "ignore" | "separate-cluster" | "nearest-cluster"
    initMethod: "random" | "k-means++" | "predefined"
    randomSeed?: number
}

/**
 * Dados para treinamento de algoritmos de clustering
 */
export interface ClusteringTrainingData {
    itemIds: string[]
    embeddings: EmbeddingVector[]
    metadata?: Record<string, any>
}

/**
 * Informações detalhadas sobre um cluster
 */
export interface ClusterDetailInfo {
    id: string
    name: string
    centroid: EmbeddingVector
    memberIds: string[]
    metadata: {
        size: number
        createdAt: Date
        updatedAt: Date
        [key: string]: any
    }
}

/**
 * Resultado detalhado do processo de clustering
 */
export interface DetailedClusteringResult {
    clusters: ClusterDetailInfo[]
    assignments: number[]
    qualityScore: number
    elapsedTime: number
    iterations: number
    hasConverged: boolean
}
