/**
 * DBSCANClustering
 *
 * Implementação do algoritmo DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 * para agrupamento de embeddings baseado em densidade.
 */

import {
    ClusterMetrics,
    ClusteringConfig,
    Entity,
} from "../types"
import { calculateDistance, normalizeVector } from "../../core/utils/vector-operations"

import { getLogger } from "../../core/utils/logger"

// Valores possíveis para classificação de pontos no DBSCAN
enum PointLabel {
    UNDEFINED = -2, // Ponto ainda não processado
    NOISE = -1, // Ponto de ruído
    // Valores não negativos representam o ID do cluster
}

// Configuração específica para o algoritmo DBSCAN
export interface DBSCANConfig extends ClusteringConfig {
    // Raio da vizinhança - distância máxima para pontos serem considerados vizinhos
    epsilon: number

    // Número mínimo de pontos para formar um cluster central
    minPoints: number

    // Função de distância a ser usada
    distanceFunction: "euclidean" | "cosine" | "manhattan"

    // Como tratar pontos de ruído
    noiseHandling: "separate-cluster" | "ignore"
}

// Estendendo ClusterMetrics para incluir propriedades adicionais específicas do DBSCAN
interface DBSCANClusterMetrics extends ClusterMetrics {
    radius: number
    density: number
}

export class DBSCANClustering {
    public readonly name = "dbscan"
    private readonly logger = getLogger("DBSCANClustering")

    private readonly epsilon = 0.3 // Raio da vizinhança
    private readonly minPoints = 5 // Pontos mínimos para um cluster
    private readonly distanceFunction = "cosine" // Função de distância padrão

    /**
     * Executa o algoritmo DBSCAN para agrupar embeddings em clusters
     */
    public async cluster(
        embeddings: number[][],
        entities: Entity[]
    ): Promise<{
        clusters: Array<{
            id: string,
            centroid: number[],
            members: string[],
            entities: Entity[],
            size: number,
            density?: number, // Propriedade opcional para métricas de densidade
            memberIds?: string[] // Alias para 'members' para retrocompatibilidade
        }>,
        assignments: Record<string, number>
    }> {
        if (embeddings.length !== entities.length) {
            throw new Error("Número de embeddings não corresponde ao número de entidades")
        }

        if (embeddings.length === 0) {
            return { clusters: [], assignments: {} }
        }

        // Normalizar os embeddings
        const normalizedEmbeddings = embeddings.map(embedding => normalizeVector(embedding))

        // Executar DBSCAN
        const { clusters: clusterIds, noise } = this.runDBSCAN(normalizedEmbeddings)

        // Preparar resultado
        return this.prepareResult(normalizedEmbeddings, entities, clusterIds, noise)
    }

    /**
     * Implementação principal do algoritmo DBSCAN
     */
    private runDBSCAN(
        embeddings: number[][]
    ): { clusters: number[], noise: number[] } {
        const n = embeddings.length
        const labels: number[] = new Array(n).fill(PointLabel.UNDEFINED)
        let clusterId = 0

        // Calcular matriz de distâncias
        const distances = this.computeDistanceMatrix(embeddings)

        // Para cada ponto não visitado
        for (let pointIdx = 0; pointIdx < n; pointIdx++) {
            if (labels[pointIdx] !== PointLabel.UNDEFINED) continue

            const neighbors = this.findNeighbors(pointIdx, distances)

            // Se não houver pontos suficientes, é ruído
            if (neighbors.length < this.minPoints) {
                labels[pointIdx] = PointLabel.NOISE
                continue
            }

            // Criar novo cluster
            clusterId++
            labels[pointIdx] = clusterId

            // Processar vizinhos
            const neighborQueue = [...neighbors]
            neighborQueue.splice(neighborQueue.indexOf(pointIdx), 1)

            while (neighborQueue.length > 0) {
                const currentPoint = neighborQueue.shift()!

                if (labels[currentPoint] === PointLabel.UNDEFINED || 
                    labels[currentPoint] === PointLabel.NOISE) {
                    if (labels[currentPoint] === PointLabel.NOISE) {
                        labels[currentPoint] = clusterId
                    } else {
                        labels[currentPoint] = clusterId
                        const pointNeighbors = this.findNeighbors(currentPoint, distances)

                        if (pointNeighbors.length >= this.minPoints) {
                            neighborQueue.push(...pointNeighbors.filter(
                                neighbor => labels[neighbor] === PointLabel.UNDEFINED || 
                                          labels[neighbor] === PointLabel.NOISE
                            ))
                        }
                    }
                }
            }
        }

        const noise = labels
            .map((label, index) => label === PointLabel.NOISE ? index : -1)
            .filter(idx => idx !== -1)

        return { clusters: labels, noise }
    }

    /**
     * Calcula a matriz de distâncias entre todos os pontos
     */
    private computeDistanceMatrix(embeddings: number[][]): number[][] {
        const n = embeddings.length
        const distances: number[][] = new Array(n).fill(0).map(() => new Array(n).fill(0))

        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                if (i === j) {
                    distances[i][j] = 0
                } else {
                    const distance = calculateDistance(embeddings[i], embeddings[j], this.distanceFunction)
                    distances[i][j] = distance
                    distances[j][i] = distance
                }
            }
        }

        return distances
    }

    /**
     * Encontra vizinhos de um ponto
     */
    private findNeighbors(pointIdx: number, distances: number[][]): number[] {
        return distances[pointIdx]
            .map((distance, idx) => distance <= this.epsilon ? idx : -1)
            .filter(idx => idx !== -1)
    }

    /**
     * Prepara o resultado final
     */
    private prepareResult(
        embeddings: number[][],
        entities: Entity[],
        clusterLabels: number[],
        noise: number[]
    ): {
        clusters: Array<{
            id: string,
            centroid: number[],
            members: string[],
            entities: Entity[],
            size: number,
            density?: number,
            memberIds?: string[]
        }>,
        assignments: Record<string, number>
    } {
        const clusterMap = new Map<number, { entities: Entity[], embeddings: number[][] }>()

        // Agrupar por cluster
        clusterLabels.forEach((clusterId, idx) => {
            if (clusterId >= 0) {
                if (!clusterMap.has(clusterId)) {
                    clusterMap.set(clusterId, { entities: [], embeddings: [] })
                }
                clusterMap.get(clusterId)!.entities.push(entities[idx])
                clusterMap.get(clusterId)!.embeddings.push(embeddings[idx])
            }
        })

        // Construir resultado
        const clusters: Array<{
            id: string,
            centroid: number[],
            members: string[],
            entities: Entity[],
            size: number,
            density?: number,
            memberIds?: string[]
        }> = []
        const assignments: Record<string, number> = {}

        clusterMap.forEach((data, clusterId) => {
            const centroid = this.calculateCentroid(data.embeddings)
            const membersList = data.entities.map(entity => String(entity.id))
            
            clusters.push({
                id: `dbscan-${clusterId}`,
                centroid,
                members: membersList,
                entities: data.entities,
                size: data.entities.length,
                density: data.embeddings.length / (Math.PI * Math.pow(this.epsilon, 2)), // Cálculo aproximado de densidade
                memberIds: membersList // Alias para manter compatibilidade
            })

            data.entities.forEach(entity => {
                assignments[String(entity.id)] = clusters.length - 1
            })
        })

        return { clusters, assignments }
    }

    /**
     * Calcula o centroide de um conjunto de embeddings
     */
    private calculateCentroid(embeddings: number[][]): number[] {
        if (embeddings.length === 0) return []

        const dimension = embeddings[0].length
        const centroid = new Array(dimension).fill(0)

        for (const embedding of embeddings) {
            for (let i = 0; i < dimension; i++) {
                centroid[i] += embedding[i]
            }
        }

        for (let i = 0; i < dimension; i++) {
            centroid[i] /= embeddings.length
        }

        return normalizeVector(centroid)
    }
}
