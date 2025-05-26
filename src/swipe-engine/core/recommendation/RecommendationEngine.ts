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
import PostCluster from "../../models/PostCluster"
import PostClusterRank from "../../models/PostClusterRank"
import { RankingService } from "./RankingService"
import { UserEmbeddingService } from "../embeddings/UserEmbeddingService"
import { getLogger } from "../../core/utils/logger"

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
            const rankedCandidates = this.rankingService.rankCandidates(candidates, {
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
        try {
            this.logger.info("Buscando clusters do banco de dados")
            
            // Buscar todos os clusters ativos no banco de dados
            const dbClusters = await PostCluster.findAll({
                where: {
                    // Pode adicionar condições se necessário, como clusters ativos
                },
                order: [
                    ["size", "DESC"] // Ordenar por tamanho (opcional)
                ],
                limit: 100, // Limitar número de clusters por questão de performance
                include: [
                    {
                        model: PostClusterRank,
                        as: "postRanks",
                        required: false,
                        where: {
                            isActive: true
                        },
                        attributes: ["score", "relevanceScore", "engagementScore"]
                    }
                ]
            })
            
            // Converter para o formato ClusterInfo
            const clusters: ClusterInfo[] = dbClusters.map(cluster => {
                const clusterInfo = cluster.toClusterInfo();
                
                // Enriquecer com métricas de PostClusterRank, se disponíveis
                // Usar acesso seguro com any para evitar erros de tipo
                const postRanks = (cluster as any).postRanks || [];
                
                if (postRanks.length > 0) {
                    // Calcular métricas agregadas dos ranks
                    const avgScore = postRanks.reduce((sum: number, rank: any) => sum + (rank.score || 0), 0) / postRanks.length;
                    const avgRelevance = postRanks.reduce((sum: number, rank: any) => sum + (rank.relevanceScore || 0), 0) / postRanks.length;
                    const avgEngagement = postRanks.reduce((sum: number, rank: any) => sum + (rank.engagementScore || 0), 0) / postRanks.length;
                    
                    // Adicionar aos metadados
                    clusterInfo.metadata = {
                        ...clusterInfo.metadata,
                        avgScore,
                        avgRelevance,
                        avgEngagement,
                        totalRanks: postRanks.length
                    };
                }
                
                return clusterInfo;
            });
            
            this.logger.info(`Encontrados ${clusters.length} clusters no banco de dados`)
            
            // Se não houver clusters no banco de dados, criar alguns padrão
            if (clusters.length === 0) {
                this.logger.warn("Nenhum cluster encontrado, criando clusters padrão")
                return await this.createDefaultClusters()
            }
            
            return clusters
        } catch (error) {
            this.logger.error(`Erro ao buscar clusters: ${error}`)
            
            // Em caso de erro, retornar clusters padrão como fallback
            this.logger.warn("Usando clusters padrão como fallback devido a erro")
            return this.getDefaultClusters()
        }
    }
    
    /**
     * Cria clusters padrão no banco de dados
     * @returns Lista de clusters padrão
     */
    private async createDefaultClusters(): Promise<ClusterInfo[]> {
        try {
            const defaultClusters = [
                {
                    name: "Tecnologia e Programação",
                    centroid: JSON.stringify({
                        dimension: 16,
                        values: new Array(16).fill(0).map((_, i) => (i % 2 === 0 ? 0.1 : -0.1)),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }),
                    topics: ["tecnologia", "programação", "desenvolvimento", "software"],
                    category: "tecnologia",
                    tags: ["tech", "code", "dev", "programming"],
                    size: 100,
                    density: 0.8,
                    avgEngagement: 0.5,
                    metadata: {
                        description: "Conteúdo relacionado a tecnologia e programação",
                        recommendationPriority: "high"
                    }
                },
                {
                    name: "Esportes e Fitness",
                    centroid: JSON.stringify({
                        dimension: 16,
                        values: new Array(16).fill(0).map((_, i) => (i % 3 === 0 ? 0.15 : -0.05)),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }),
                    topics: ["esportes", "fitness", "saúde", "bem-estar"],
                    category: "esportes",
                    tags: ["sports", "fitness", "health", "workout"],
                    size: 150,
                    density: 0.7,
                    avgEngagement: 0.6,
                    metadata: {
                        description: "Conteúdo relacionado a esportes e atividades físicas",
                        recommendationPriority: "medium"
                    }
                },
                {
                    name: "Arte e Cultura",
                    centroid: JSON.stringify({
                        dimension: 16,
                        values: new Array(16).fill(0).map((_, i) => (i % 4 === 0 ? 0.2 : -0.1)),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }),
                    topics: ["arte", "cultura", "música", "cinema"],
                    category: "arte",
                    tags: ["art", "culture", "music", "cinema"],
                    size: 120,
                    density: 0.65,
                    avgEngagement: 0.45,
                    metadata: {
                        description: "Conteúdo relacionado a artes e manifestações culturais",
                        recommendationPriority: "medium"
                    }
                }
            ]
            
            // Criar os clusters no banco de dados
            const createdClusters: ClusterInfo[] = []
            
            for (const cluster of defaultClusters) {
                const newCluster = await PostCluster.create({
                    name: cluster.name,
                    centroid: cluster.centroid,
                    topics: cluster.topics,
                    memberIds: [],
                    category: cluster.category,
                    tags: cluster.tags,
                    size: cluster.size,
                    density: cluster.density,
                    avgEngagement: cluster.avgEngagement,
                    metadata: cluster.metadata
                })
                
                createdClusters.push(newCluster.toClusterInfo())
            }
            
            this.logger.info(`Criados ${createdClusters.length} clusters padrão`)
            return createdClusters
            
        } catch (error) {
            this.logger.error(`Erro ao criar clusters padrão: ${error}`)
            return this.getDefaultClusters()
        }
    }
    
    /**
     * Retorna clusters padrão em memória (sem persistir no banco de dados)
     * Usado como último recurso quando não é possível acessar ou criar clusters no banco
     */
    private getDefaultClusters(): ClusterInfo[] {
        this.logger.warn("Usando clusters padrão em memória")
        
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
