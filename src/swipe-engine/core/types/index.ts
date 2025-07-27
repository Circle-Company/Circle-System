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
    id: string
    userId: string
    vector: number[]
    updatedAt: Date
    interests?: string[]
}

export interface PostEmbedding {
    postId: string
    vector: number[]
    timestamp: Date
    version: string
}

export interface ClusterInfo {
    id: string
    name?: string
    centroid: number[]
    size: number
    topics?: string[]
    contentIds?: string[]
    createdAt: Date
    updatedAt: Date
    coherence?: number
    density?: number
}

export interface MatchResult {
    clusterId: string
    clusterName: string
    similarity: number
    cluster: ClusterInfo
}

export interface UserProfile {
    id: string
    userId: string
    interests?: string[]
    interactions?: UserInteraction[]
    preferences?: UserPreferences
    demographics?: UserDemographics
}

export interface UserInteraction {
    id: string
    userId: string
    entityId: string
    entityType: string
    contentId?: string
    type: string
    timestamp: Date
    topics?: string[]
    duration?: number
    score?: number
    postIds?: string[]
}

export interface UserPreferences {
    contentTypes?: string[]
    topicPreferences?: Record<string, number>
    timeOfDayPreferences?: Record<string, number>
    creator_preferences?: Record<string, number>
}

export interface UserDemographics {
    age?: number
    gender?: string
    location?: string
    language?: string
}

export interface RecommendationContext {
    timeOfDay?: number // Hora do dia (0-23)
    dayOfWeek?: number // Dia da semana (0-6, com 0 = Domingo)
    location?: string
    device?: string
    sessionId?: string
    requestType?: string
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

export interface ContentMetadata {
    id: string
    type: string
    topics: string[]
    creator: string
    createdAt: Date
    duration?: number
    engagement?: ContentEngagement
}

export interface ContentEngagement {
    views: number
    likes: number
    comments: number
    shares: number
    saves: number
    avgWatchTime?: number
}
