import Moment from "../../../models/moments/moment-model"
import { Candidate, CandidateSelectorOptions, ClusterInfo, MatchResult } from "../types"
import { getLogger } from "../utils/logger"
import { EmbeddingParams } from "../../params"

export class CandidateSelector {
    private readonly logger = getLogger("CandidateSelector")
    private readonly weights = EmbeddingParams.candidateSelector.weights
    private readonly thresholds = EmbeddingParams.candidateSelector.thresholds
    private readonly PostModel = Moment

    constructor(weights?: Partial<typeof EmbeddingParams.candidateSelector.weights>) {
        // Permite customização dos pesos no construtor
        if (weights) {
            this.weights = { ...this.weights, ...weights }
        }
    }

    /**
     * Seleciona candidatos dos clusters correspondentes
     */
    async selectCandidates(
        matchedClusters: MatchResult[],
        options: CandidateSelectorOptions
    ): Promise<Candidate[]> {
        try {
            const {
                limit = this.thresholds.defaultLimit,
                excludeIds = new Set<string>(),
                userId,
                timeWindow = this.thresholds.timeWindow,
            } = options

            // Filtra e ordena clusters por score
            const validClusters = matchedClusters
                .filter((match) => match.score > this.thresholds.minimumClusterScore)
                .sort((a, b) => b.score - a.score)

            // Coleta candidatos de cada cluster
            const allCandidates: Candidate[] = []

            for (const match of validClusters) {
                const clusterCandidates = await this.getCandidatesFromCluster(match.cluster, {
                    excludeIds,
                    userId,
                    timeWindow,
                    clusterScore: match.score,
                    limit: Math.ceil(limit / validClusters.length) + this.thresholds.bufferSize,
                })
                allCandidates.push(...clusterCandidates)
            }
            // Retorna todos os candidatos
            return allCandidates
        } catch (error: any) {
            this.logger.error(`Erro ao selecionar candidatos: ${error.message}`)
            return []
        }
    }

    /**
     * Obtém candidatos de um cluster específico
     */
    private async getCandidatesFromCluster(
        cluster: ClusterInfo,
        options: {
            excludeIds: Set<string>
            userId: string
            timeWindow: number
            clusterScore: number
            limit: number
        }
    ): Promise<Candidate[]> {
        try {
            const { excludeIds, userId, timeWindow, clusterScore, limit } = options

            // TODO: Implementar query real ao banco de dados
            // Placeholder para demonstração
            const candidates = cluster.memberIds || []
            if (!candidates.length) {
                this.logger.error(`Nenhum candidato encontrado para o cluster: ${cluster.id}`)
                return []
            }

            // Mapear IDs para objetos candidatos
            const hidratedCandidates = await Promise.all(
                candidates.map(async (candidateId) => {
                    try {
                        // Busca no banco de dados
                        const momentData = await this.PostModel.findOne({
                            where: {
                                id: candidateId,
                            },
                            attributes: ["id", "user_id", "created_at"],
                        })
                        if (!momentData) return null

                        // Adapta os dados do modelo para o formato candidato
                        const created = momentData.get("created_at")
                        const createdDate = created instanceof Date ? created : new Date()

                        return {
                            id: candidateId,
                            user_id: momentData.get("user_id")?.toString() || "1",
                            created_at: createdDate,
                            statistics: {
                                likes: 0,
                                comments: 0,
                                shares: 0,
                            },
                        }
                    } catch (err) {
                        this.logger.error(`Erro ao buscar candidato ${candidateId}: ${err}`)
                        return null
                    }
                })
            )

            // Filtra e formata candidatos válidos
            const validCandidates: Candidate[] = []

            for (const candidate of hidratedCandidates) {
                if (!candidate) continue

                if (
                    !excludeIds.has(candidate.id.toString()) &&
                    candidate.user_id !== userId &&
                    this.isWithinTimeWindow(candidate.created_at, timeWindow)
                ) {
                    validCandidates.push({
                        id: candidate.id,
                        created_at: candidate.created_at,
                        statistics: candidate.statistics,
                        clusterScore,
                    })
                }
            }

            return validCandidates
        } catch (error: any) {
            this.logger.error(`Erro ao obter candidatos do cluster: ${error.message}`)
            return []
        }
    }

    /**
     * Verifica se um candidato está dentro da janela de tempo
     */
    private isWithinTimeWindow(created_at: Date, timeWindow: number): boolean {
        const now = new Date()
        const age = now.getTime() - new Date(created_at).getTime()
        const ageInHours = age / (1000 * 60 * 60)
        return ageInHours <= timeWindow
    }
}
