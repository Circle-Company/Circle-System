import { getLogger } from "../../core/utils/logger"
import { UserEmbeddingService } from "../embeddings/UserEmbeddingService"
import {
    ClusterInfo,
    MatchResult,
    Recommendation,
    RecommendationContext,
    RecommendationOptions,
    UserEmbedding,
    UserProfile,
} from "../types"
import { CandidateSelector } from "./CandidateSelector"
import { ClusterMatcher } from "./ClusterMatcher"
import { RankingService } from "./RankingService"

export class RecommendationEngine {
    private userEmbeddingService: UserEmbeddingService | null = null
    private clusterMatcher: ClusterMatcher
    private candidateSelector: CandidateSelector
    private rankingService: RankingService
    private readonly logger = getLogger("RecommendationEngine")

    constructor(config?: any) {
        // Inicializar componentes
        this.clusterMatcher = new ClusterMatcher(config?.clusters || [], {
            minMatchThreshold: 0.2,
            contextWeight: 0.3,
            interestWeight: 0.3,
            embeddingWeight: 0.4,
        })
        this.candidateSelector = new CandidateSelector()
        this.rankingService = new RankingService()

        // Configurar componentes com base no config, se fornecido
        if (config?.userEmbeddingService) {
            this.userEmbeddingService = config.userEmbeddingService
        }

        this.logger.info("Motor de recomendação inicializado com DBSCAN")
    }

    /**
     * Gera recomendações para um usuário
     *
     * @param userId ID do usuário
     * @param limit Número máximo de recomendações
     * @param options Opções adicionais
     */
    public async getRecommendations(
        userId: string | bigint,
        limit: number = 10,
        options: RecommendationOptions = {}
    ): Promise<Recommendation[]> {
        try {
            // 1. Obter embedding do usuário (se serviço disponível)
            let userEmbedding: UserEmbedding | null = null
            let userProfile: UserProfile | null = null

            if (this.userEmbeddingService) {
                userEmbedding = await this.userEmbeddingService.getUserEmbedding(BigInt(userId))
            }

            // 2. Obter clusters que correspondem ao perfil do usuário
            // TODO: Implementar obtenção de clusters do repositório
            const clusters = await this.getOrCreateClusters()

            this.clusterMatcher = new ClusterMatcher(clusters)
            // Usando tipo condicional para lidar com valores nulos
            const matchingClusters = await this.findRelevantClusters(
                userEmbedding,
                userProfile,
                options.context
            )

            // 3. Selecionar candidatos a partir dos clusters
            const candidates = await this.candidateSelector.selectCandidates(matchingClusters, {
                limit: limit * 3, // Obter mais candidatos do que o necessário para ranking
                excludeIds: options.excludeIds ? new Set(options.excludeIds) : undefined,
                userId: String(userId),
            })

            // 4. Ranquear candidatos
            const rankedCandidates = await this.rankingService.rankCandidates(candidates, {
                userEmbedding,
                userProfile,
                limit,
                diversityLevel: options.diversity || 0.3,
                noveltyLevel: options.novelty || 0.2,
                context: options.context,
            })

            return rankedCandidates.map((candidate) => ({
                entityId: typeof candidate.id === "number" ? BigInt(candidate.id) : candidate.id,
                entityType: "post",
                score: candidate.finalScore,
                timestamp: new Date(),
                source: "recommendation_engine",
            }))
        } catch (error: any) {
            this.logger.error(
                `Erro ao gerar recomendações para usuário ${userId}: ${error.message}`
            )
            return []
        }
    }

    /**
     * Encontra clusters relevantes para um usuário
     */
    private async findRelevantClusters(
        userEmbedding: UserEmbedding | null,
        userProfile: UserProfile | null,
        context?: RecommendationContext
    ): Promise<MatchResult[]> {
        // Implementação modificada para aceitar valores nulos
        return this.clusterMatcher.findRelevantClusters(userEmbedding, userProfile, context)
    }

    /**
     * Obtém clusters existentes ou cria novos se não existirem
     * @returns Lista de clusters
     */
    private async getOrCreateClusters(): Promise<ClusterInfo[]> {
        // TODO: Implementar lógica para obter clusters de um repositório
        // Por enquanto, retornamos clusters de exemplo (isso seria substituído por dados reais)
        return [
            {
                id: "cluster-1",
                name: "Tecnologia e Programação",
                centroid: {
                    dimension: 16,
                    values: new Array(16).fill(0).map((_, i) => (i % 2 === 0 ? 0.1 : -0.1)),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                topics: ["tecnologia", "programação", "desenvolvimento", "software"],
                size: 100,
                density: 0.8,
            },
            {
                id: "cluster-2",
                name: "Esportes e Fitness",
                centroid: {
                    dimension: 16,
                    values: new Array(16).fill(0).map((_, i) => (i % 3 === 0 ? 0.15 : -0.05)),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                topics: ["esportes", "fitness", "saúde", "bem-estar"],
                size: 150,
                density: 0.7,
            },
            {
                id: "cluster-3",
                name: "Arte e Cultura",
                centroid: {
                    dimension: 16,
                    values: new Array(16).fill(0).map((_, i) => (i % 4 === 0 ? 0.2 : -0.1)),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                topics: ["arte", "cultura", "música", "cinema"],
                size: 120,
                density: 0.65,
            },
        ]
    }
}
