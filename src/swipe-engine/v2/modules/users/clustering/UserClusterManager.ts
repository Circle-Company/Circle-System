/**
 * UserClusterManager
 *
 * Gerencia clusters de usuários, integrando-se com os algoritmos
 * de clustering do SwipeEngine e adicionando funcionalidades específicas.
 */

import {
    ClusterInfo,
    ClusteringConfig,
    ClusteringResult,
    Entity,
    UserEmbedding,
} from "../../../core/types"
import { normalizeVector } from "../../../core/utils/vector-operations"
import { UserEmbeddingBuilder } from "../embedding/UserEmbeddingBuilder"

// Interface para algoritmo de clustering
export interface IClusteringAlgorithm {
    cluster(
        embeddings: number[][],
        entities: Entity[],
        config: ClusteringConfig
    ): Promise<ClusteringResult>
}

export class UserClusterManager {
    private clusteringAlgorithm: IClusteringAlgorithm
    private userEmbeddingBuilder: UserEmbeddingBuilder
    private cachedClusters: Map<string, ClusterInfo> = new Map()
    private lastClusteringTimestamp: Date | null = null

    /**
     * Constrói uma nova instância de UserClusterManager
     *
     * @param clusteringAlgorithm Algoritmo de clustering a ser utilizado
     * @param userEmbeddingBuilder Builder de embeddings de usuário
     */
    constructor(
        clusteringAlgorithm: IClusteringAlgorithm,
        userEmbeddingBuilder: UserEmbeddingBuilder
    ) {
        this.clusteringAlgorithm = clusteringAlgorithm
        this.userEmbeddingBuilder = userEmbeddingBuilder
    }

    /**
     * Gera clusters com base em embeddings de usuários
     *
     * @param userIds IDs dos usuários para clusterização
     * @param config Configuração para o algoritmo de clustering
     * @returns Resultado da clusterização
     */
    public async generateClusters(
        userIds: bigint[],
        config: ClusteringConfig = {}
    ): Promise<ClusteringResult> {
        try {
            // Obter embeddings para todos os usuários
            const userEmbeddings: UserEmbedding[] = await Promise.all(
                userIds.map((userId) => this.userEmbeddingBuilder.buildEmbedding(userId))
            )

            // Extrair vetores e normalizar
            const embeddings = userEmbeddings.map((e) => {
                return normalizeVector(Array.from(e.vector.values))
            })

            // Preparar entidades para o algoritmo de clustering
            const entities: Entity[] = userEmbeddings.map((e) => ({
                id: e.userId,
                type: "user",
                metadata: e.metadata,
            }))

            // Executar algoritmo de clustering
            const result = await this.clusteringAlgorithm.cluster(embeddings, entities, config)

            // Atualizar cache
            result.clusters.forEach((cluster) => {
                this.cachedClusters.set(cluster.id, cluster)
            })
            this.lastClusteringTimestamp = new Date()

            return result
        } catch (error: any) {
            console.error(`Erro ao gerar clusters de usuários: ${error.message}`)
            throw new Error(`Falha na geração de clusters: ${error.message}`)
        }
    }

    /**
     * Encontra os clusters mais relevantes para um usuário específico
     *
     * @param userId ID do usuário
     * @param limit Número máximo de clusters a retornar
     * @returns Lista de clusters ordenados por relevância
     */
    public async findRelevantClustersForUser(
        userId: bigint,
        limit: number = 3
    ): Promise<ClusterInfo[]> {
        try {
            // Verificar se temos clusters em cache
            if (this.cachedClusters.size === 0) {
                throw new Error("Nenhum cluster disponível. Execute generateClusters primeiro.")
            }

            // Obter embedding do usuário
            const userEmbedding = await this.userEmbeddingBuilder.buildEmbedding(userId)
            const userVector = normalizeVector(Array.from(userEmbedding.vector.values))

            // Calcular similaridade com todos os clusters
            const clusterSimilarities = Array.from(this.cachedClusters.values()).map((cluster) => {
                const centroidVector = normalizeVector(Array.from(cluster.centroid.values))

                // Cálculo de similaridade de cosseno
                let dotProduct = 0
                for (let i = 0; i < userVector.length; i++) {
                    dotProduct += userVector[i] * centroidVector[i]
                }

                return {
                    cluster,
                    similarity: dotProduct,
                }
            })

            // Ordenar por similaridade e limitar
            return clusterSimilarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
                .map((item) => item.cluster)
        } catch (error: any) {
            console.error(`Erro ao encontrar clusters para usuário ${userId}: ${error.message}`)
            throw new Error(`Falha ao buscar clusters relevantes: ${error.message}`)
        }
    }

    /**
     * Verifica se é necessário recalcular os clusters
     *
     * @param maxAgeHours Idade máxima em horas antes de recalcular
     * @returns True se os clusters precisam ser atualizados
     */
    public needsReclustering(maxAgeHours: number = 24): boolean {
        if (!this.lastClusteringTimestamp) return true

        const ageInHours = (Date.now() - this.lastClusteringTimestamp.getTime()) / (1000 * 60 * 60)
        return ageInHours > maxAgeHours
    }

    /**
     * Retorna o total de clusters atualmente em cache
     */
    public get clusterCount(): number {
        return this.cachedClusters.size
    }
}
