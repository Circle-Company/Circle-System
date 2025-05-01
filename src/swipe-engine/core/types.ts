/**
 * Tipos comuns para o motor de recomendação v2
 */

/**
 * Tipos de entidades suportadas pelo sistema
 */
export type EntityType = "user" | "post"

/**
 * Referência a uma entidade em um cluster
 */
export interface EntityReference {
    id: string | bigint
    type: EntityType
    weight: number // 0.0 a 1.0, representa a força da associação ao cluster
    creatorId?: string | bigint // ID do criador, se aplicável
}
/**
 * Representação completa de um cluster
 */
export interface Cluster {
    id: string
    type: EntityType
    centroid: number[] // Vetor que representa o centro do cluster
    radius: number // Distância máxima de qualquer membro ao centroide
    members: EntityReference[]
    size: number // Número de membros
    createdAt: Date
    updatedAt: Date
    metadata: Record<string, any>
    metrics: ClusterMetrics
}

/**
 * Configuração para algoritmos de clustering
 */
export interface ClusterConfig {
    numClusters?: number
    maxDistance?: number
    cohesionThreshold?: number
    minClusterSize?: number
    maxClusterSize?: number
    maxIterations?: number
    distanceFunction?: "cosine" | "euclidean" | "manhattan"
    algorithmSpecific?: Record<string, any>
}

/**
 * Interface para referência a uma entidade
 */
export interface Entity {
    id: string | bigint
    type: EntityType
    metadata?: Record<string, any>
}

/**
 * Props para gerar embedding de usuário
 */
export interface UserEmbeddingProps {
    interactionHistory: UserInteraction[]
    viewingPatterns: ViewMetrics[]
    contentPreferences: string[]
    demographicInfo?: UserDemographics
}

/**
 * Props para gerar embedding de post
 */
export interface PostEmbeddingProps {
    textContent: string
    tags: string[]
    engagementMetrics: EngagementMetrics
    authorId: bigint
    createdAt: Date
}

/**
 * Representa uma interação do usuário
 */
export interface UserInteraction {
    id: string
    userId: bigint
    entityId: bigint
    entityType: EntityType
    type: InteractionType
    timestamp: Date
    metadata?: Record<string, any>
}

/**
 * Métricas de visualização
 */
export interface ViewMetrics {
    contentType: string
    averageDuration: number
    completionRate: number
    frequency: number
}

/**
 * Informações demográficas do usuário
 */
export interface UserDemographics {
    ageRange?: string
    location?: string
    languages?: string[]
    interests?: string[]
}

/**
 * Métricas de engajamento para posts
 */
export interface EngagementMetrics {
    views: number
    likes: number
    comments: number
    shares: number
    saves: number
    engagementRate: number
}

/**
 * Dados para atualização de embedding de post
 */
export interface UpdatedPostStats {
    engagementMetrics?: Partial<EngagementMetrics>
    lastInteraction?: Date
}

/**
 * Resultado de recomendação
 */
export interface RecommendationResult {
    items: RecommendedItem[]
    metadata: {
        generatedAt: Date
        strategy: string
        diversity: number
        freshness: number
    }
}

/**
 * Item recomendado
 */
export interface RecommendedItem {
    id: string | bigint
    type: EntityType
    score: number
    reasons: RecommendationReason[]
    metadata?: Record<string, any>
}

/**
 * Razão para uma recomendação
 */
export interface RecommendationReason {
    type: string // 'similar-interest', 'popular-in-network', etc.
    strength: number // 0.0 a 1.0
    explanation: string
    sourceEntityId?: string | bigint
}

/**
 * Tipos e interfaces para o sistema de recomendação do Swipe Engine v2
 */

/**
 * Representa um vetor de embedding
 */
export interface EmbeddingVector {
    /** Dimensão do vetor */
    dimension: number

    /** Valores do vetor */
    values: number[]

    /** Timestamp de quando o embedding foi gerado */
    createdAt: Date

    /** Timestamp da última atualização do embedding */
    updatedAt: Date
}

/**
 * Embedding vetorial de um usuário
 */
export interface UserEmbedding {
    /** ID do usuário */
    userId: string

    /** Vetor de embedding do usuário */
    vector: EmbeddingVector

    /** Metadados adicionais sobre o embedding */
    metadata?: Record<string, any>
}

/**
 * Embedding vetorial de um post/conteúdo
 */
export interface PostEmbedding {
    /** ID do post */
    postId: string

    /** Vetor de embedding do post */
    vector: EmbeddingVector

    /** Metadados adicionais sobre o embedding */
    metadata?: Record<string, any>
}

/**
 * Informações sobre um cluster de usuários ou conteúdos
 */
export interface ClusterMetrics {
    /** Coesão do cluster (0-1, onde 1 é máxima coesão) */
    cohesion: number
    /** Estabilidade do cluster (0-1, onde 1 é máxima estabilidade) */
    stability: number
    /** Taxa de crescimento do cluster */
    growth: number
    /** Densidade do cluster */
    density: number
}

export interface ClusterInfo {
    /** ID único do cluster */
    id: string

    /** Nome ou descrição do cluster */
    name: string

    /** Vetor centroide que representa o centro do cluster */
    centroid: EmbeddingVector

    /** Tópicos ou tags associados a este cluster */
    topics?: string[]

    /** IDs dos usuários que pertencem a este cluster */
    memberIds?: string[]

    /** Período do dia em que este cluster está mais ativo [início, fim] em horas (0-23) */
    activeTimeOfDay?: [number, number]

    /** Dias da semana em que este cluster está mais ativo (0 = domingo, 6 = sábado) */
    activeDaysOfWeek?: number[]

    /** Localizações preferidas dos membros deste cluster */
    preferredLocations?: string[]

    /** Idiomas predominantes neste cluster */
    languages?: string[]

    /** Tamanho do cluster (número de membros) */
    size?: number

    /** Densidade do cluster (média das distâncias ao centroide) */
    density?: number

    /** Metadados adicionais sobre o cluster */
    metadata?: Record<string, any>
}

/**
 * Resultado de correspondência entre um usuário e um cluster
 */
export interface MatchResult {
    /** ID do cluster */
    clusterId: string

    /** Nome do cluster */
    clusterName: string

    /** Valor de similaridade (0-1) */
    similarity: number

    /** Score calculado para o match */
    score: number

    /** Referência para o objeto de cluster completo */
    cluster: ClusterInfo
}

/**
 * Perfil de usuário com informações adicionais para melhorar recomendações
 */
export interface UserProfile {
    /** ID do usuário */
    userId: string

    /** Interesses declarados pelo usuário */
    interests: string[]

    /** Histórico de interações do usuário */
    interactions?: {
        /** IDs de posts com que o usuário interagiu */
        postIds: string[]

        /** Tipo de interação (like, comment, share, etc) */
        type: string

        /** Timestamp da interação */
        timestamp: Date
    }[]

    /** Dados demográficos do usuário */
    demographics?: {
        /** Faixa etária */
        ageRange?: string

        /** Localização */
        location?: string

        /** Idioma preferido */
        language?: string

        /** Gênero */
        gender?: string
    }

    /** Preferências explícitas do usuário */
    preferences?: Record<string, any>
}

/**
 * Contexto da recomendação
 */
export interface RecommendationContext {
    /** Hora do dia (0-23) */
    timeOfDay?: number

    /** Dia da semana (0 = domingo, 6 = sábado) */
    dayOfWeek?: number

    /** Localização atual do usuário */
    location?: string

    /** Idioma atual da sessão */
    language?: string

    /** Dispositivo usado (mobile, desktop, etc) */
    device?: string

    /** Objetivo atual da sessão, se conhecido */
    sessionGoal?: string

    /** Query de pesquisa, se aplicável */
    searchQuery?: string

    /** Categoria de conteúdo sendo explorada */
    contentCategory?: string

    /** Dados adicionais de contexto */
    additionalContext?: Record<string, any>
}

/**
 * Configuração do algoritmo de clustering
 */
export interface ClusteringConfig {
    /** Número desejado de clusters */
    numClusters?: number

    /** Número máximo de iterações para o algoritmo */
    maxIterations?: number

    /** Limiar de convergência */
    convergenceThreshold?: number

    /** Estratégia para lidar com outliers */
    outlierStrategy?: "ignore" | "separate-cluster" | "nearest-cluster"

    /** Método de inicialização */
    initMethod?: "random" | "k-means++" | "predefined"

    /** Configurações adicionais específicas do algoritmo */
    algorithmSpecific?: Record<string, any>
}

/**
 * Resultado de uma operação de clustering
 */
export interface ClusteringResult {
    /** Informações sobre os clusters gerados */
    clusters: ClusterInfo[]

    /** Mapeamento de IDs para índices de cluster */
    assignments: Record<string, number>

    /** Pontuação de qualidade do clustering (maior é melhor) */
    quality?: number

    /** Tempo levado para realizar o clustering (ms) */
    elapsedTime?: number

    /** Número de iterações realizadas */
    iterations?: number

    /** Indicador se o algoritmo convergiu */
    converged?: boolean

    /** Metadados adicionais sobre o resultado */
    metadata?: Record<string, any>
}

/**
 * Dados de treinamento para algoritmos de clustering
 */
export interface ClusteringTrainingData {
    /** IDs dos itens a serem clusterizados */
    ids: string[]

    /** Vetores de embedding correspondentes aos IDs */
    vectors: number[][]

    /** Metadados opcionais para cada item */
    metadata?: Record<string, Record<string, any>>
}

/**
 * Opções para recomendação
 */
export interface RecommendationOptions {
    /** Número máximo de recomendações a retornar */
    limit?: number

    /** IDs de itens a serem excluídos das recomendações */
    excludeIds?: string[]

    /** Diversidade desejada (0-1, onde 1 é máxima diversidade) */
    diversity?: number

    /** Novidade desejada (0-1, onde 1 prioriza itens mais recentes) */
    novelty?: number

    /** Contexto da recomendação */
    context?: RecommendationContext

    /** Filtros específicos a serem aplicados */
    filters?: Record<string, any>
}

/**
 * Tipos de interação que um usuário pode ter com um item
 */
export enum InteractionType {
    LIKE = "like",
    COMMENT = "comment",
    SHARE = "share",
    SAVE = "save",
    VIEW = "view",
}

/**
 * Níveis de força para interações
 */
export enum InteractionStrength {
    VERY_NEGATIVE = -1.0,
    NEGATIVE = -0.5,
    NEUTRAL = 0.0,
    VERY_LOW = 0.05,
    LOW = 0.1,
    MEDIUM = 0.3,
    HIGH = 0.5,
    VERY_HIGH = 0.8,
}

/**
 * Interface que define métricas para o sistema de recomendação
 */
export interface RecommendationMetrics {
    /** Taxa de cliques */
    ctr: number
    /** Taxa de engajamento geral */
    engagementRate: number
    /** Tempo médio gasto com as recomendações */
    averageTimeSpent: number
    /** Percentual de recomendações que receberam interação */
    interactionRate: number
    /** Diversidade das recomendações */
    diversity: number
    /** Novidade das recomendações */
    novelty: number
    /** Precisão das recomendações */
    precision?: number
    /** Recall das recomendações */
    recall?: number
    /** Cobertura do catálogo */
    catalogCoverage?: number
    /** Métricas personalizadas adicionais */
    custom?: Record<string, number>
}

/**
 * Interface para representar uma recomendação
 */
export interface Recommendation {
    /** ID da entidade recomendada */
    entityId: string | bigint
    /** Tipo da entidade recomendada */
    entityType: EntityType
    /** Pontuação de relevância */
    score: number
    /** Timestamp da recomendação */
    timestamp: Date
    /** Origem da recomendação */
    source: string
    /** Motivos para a recomendação */
    reasons?: RecommendationReason[]
    /** Metadados adicionais */
    metadata?: Record<string, any>
}

/**
 * Adicionando tipos que estão faltando
 */
export interface Candidate {
    id: string | number
    embedding?: UserEmbedding
    user_id?: string
    clusterScore?: number
    statistics?: {
        likes?: number
        comments?: number
        shares?: number
        views?: number
    }
    created_at: string | Date
}

export interface RankedCandidate extends Candidate {
    relevanceScore: number
    engagementScore: number
    noveltyScore: number
    diversityScore: number
    contextScore: number
    finalScore: number
}

export interface RankingOptions {
    userEmbedding: UserEmbedding | null
    userProfile: UserProfile | null
    limit?: number
    diversityLevel?: number
    noveltyLevel?: number
    context?: RecommendationContext
}

/**
 * Adicionando tipo que está faltando
 */
export interface CandidateSelectorOptions {
    /** Número máximo de candidatos a retornar */
    limit?: number
    /** IDs que devem ser excluídos dos resultados */
    excludeIds?: Set<string>
    /** ID do usuário atual */
    userId: string
    /** Janela de tempo em horas para filtrar candidatos */
    timeWindow?: number
}
