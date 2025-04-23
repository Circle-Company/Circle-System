/**
 * DBSCANClustering
 *
 * Implementação do algoritmo DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 * para agrupamento de embeddings baseado em densidade.
 */

import {
    Cluster,
    ClusterConfig,
    ClusterInfo,
    ClusterMetrics,
    ClusteringConfig,
    ClusteringResult,
    ClusteringTrainingData,
    Entity,
} from "../types"
import { getLogger } from "../utils/logger"
import { calculateDistance, normalizeVector } from "../utils/vector-operations"

// Valores possíveis para classificação de pontos no DBSCAN
enum PointLabel {
    UNDEFINED = -2, // Ponto ainda não processado
    NOISE = -1, // Ponto de ruído (não pertence a nenhum cluster)
    // Valores não negativos representam o ID do cluster ao qual o ponto pertence
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

    // Configuração padrão para o algoritmo
    private readonly defaultConfig: DBSCANConfig = {
        epsilon: 0.3, // Raio da vizinhança
        minPoints: 5, // Pontos mínimos para um cluster core
        distanceFunction: "cosine", // Função de distância padrão
        noiseHandling: "separate-cluster", // Como tratar ruído
        maxIterations: 1, // DBSCAN é não-iterativo, mas mantemos por compatibilidade
        initMethod: "random", // Valor compatível com o tipo esperado
    }

    /**
     * Executa o algoritmo DBSCAN para agrupar embeddings em clusters
     *
     * @param embeddings Lista de vetores de embedding para agrupamento
     * @param entities Entidades correspondentes aos embeddings
     * @param config Configuração do algoritmo
     * @returns Resultado da clusterização com os clusters formados
     */
    public async cluster(
        embeddings: number[][],
        entities: Entity[],
        config: ClusterConfig = {}
    ): Promise<ClusteringResult> {
        // Validar entrada
        if (embeddings.length !== entities.length) {
            throw new Error(
                `Número de embeddings (${embeddings.length}) não corresponde ao número de entidades (${entities.length})`
            )
        }

        if (embeddings.length === 0) {
            return { clusters: [], assignments: {}, quality: 0, converged: true, iterations: 0 }
        }

        // Iniciar cronômetro para medição de desempenho
        const startTime = Date.now()

        // Aplicar configuração padrão com override da configuração fornecida
        const dbscanConfig: DBSCANConfig = {
            ...this.defaultConfig,
            ...config,
        }

        // Normalizar os embeddings para garantir consistência
        const normalizedEmbeddings = embeddings.map((embedding) => normalizeVector(embedding))

        // Executar o algoritmo DBSCAN
        const startDbscan = Date.now()
        const { clusters: clusterIds, noise } = this.runDBSCAN(normalizedEmbeddings, dbscanConfig)
        const dbscanTime = Date.now() - startDbscan
        this.logger.info(
            `DBSCAN executado em ${dbscanTime}ms, encontrou ${
                new Set(clusterIds.filter((id) => id >= 0)).size
            } clusters`
        )

        // Preparar dados para retorno
        const result = this.prepareClusteringResult(
            normalizedEmbeddings,
            entities,
            clusterIds,
            noise,
            dbscanConfig
        )

        // Calcular estatísticas finais
        const elapsedTime = Date.now() - startTime
        return {
            ...result,
            elapsedTime,
            iterations: 1, // DBSCAN não é iterativo
            converged: true,
        }
    }

    /**
     * Implementação principal do algoritmo DBSCAN
     *
     * @param embeddings Vetores normalizados
     * @param config Configuração do DBSCAN
     * @returns IDs de cluster atribuídos a cada ponto e pontos de ruído
     */
    private runDBSCAN(
        embeddings: number[][],
        config: DBSCANConfig
    ): { clusters: number[]; noise: number[] } {
        const n = embeddings.length
        // Inicializar todos os pontos como não visitados
        const labels: number[] = new Array(n).fill(PointLabel.UNDEFINED)
        let clusterId = 0 // Contador para IDs de cluster

        // Calcular a matriz de distâncias entre pontos
        // (poderia ser otimizado para cálculo sob demanda em implementações com muitos pontos)
        const distances: number[][] = this.computeDistanceMatrix(
            embeddings,
            config.distanceFunction
        )

        // Para cada ponto não visitado
        for (let pointIdx = 0; pointIdx < n; pointIdx++) {
            // Pular pontos já atribuídos a clusters ou marcados como ruído
            if (labels[pointIdx] !== PointLabel.UNDEFINED) {
                continue
            }

            // Encontrar pontos vizinhos dentro do raio epsilon
            const neighbors = this.findNeighbors(pointIdx, distances, config.epsilon)

            // Se não houver pontos suficientes na vizinhança, marcar como ruído
            if (neighbors.length < config.minPoints) {
                labels[pointIdx] = PointLabel.NOISE
                continue
            }

            // Iniciar um novo cluster
            clusterId++
            labels[pointIdx] = clusterId

            // Processar os vizinhos recursivamente
            const neighborQueue = [...neighbors]
            neighborQueue.splice(neighborQueue.indexOf(pointIdx), 1) // Remover o ponto atual

            while (neighborQueue.length > 0) {
                const currentPoint = neighborQueue.shift()!

                // Para pontos ainda não visitados
                if (
                    labels[currentPoint] === PointLabel.UNDEFINED ||
                    labels[currentPoint] === PointLabel.NOISE
                ) {
                    // Se era ruído, agora pertence ao cluster
                    if (labels[currentPoint] === PointLabel.NOISE) {
                        labels[currentPoint] = clusterId
                    } else {
                        // Marcar como pertencente ao cluster atual
                        labels[currentPoint] = clusterId

                        // Encontrar os vizinhos deste ponto
                        const pointNeighbors = this.findNeighbors(
                            currentPoint,
                            distances,
                            config.epsilon
                        )

                        // Se for um ponto central, processar seus vizinhos também
                        if (pointNeighbors.length >= config.minPoints) {
                            for (const neighbor of pointNeighbors) {
                                // Adicionar vizinhos ainda não processados à fila
                                if (
                                    labels[neighbor] === PointLabel.UNDEFINED ||
                                    labels[neighbor] === PointLabel.NOISE
                                ) {
                                    if (!neighborQueue.includes(neighbor)) {
                                        neighborQueue.push(neighbor)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Coletar pontos de ruído
        const noise = labels
            .map((label, index) => (label === PointLabel.NOISE ? index : -1))
            .filter((idx) => idx !== -1)

        return { clusters: labels, noise }
    }

    /**
     * Calcula a matriz de distâncias entre todos os pontos
     *
     * @param embeddings Vetores de embedding
     * @param distanceFunction Função de distância a ser usada
     * @returns Matriz de distâncias [i][j] = distância entre pontos i e j
     */
    private computeDistanceMatrix(embeddings: number[][], distanceFunction: string): number[][] {
        const n = embeddings.length
        const distances: number[][] = new Array(n).fill(0).map(() => new Array(n).fill(0))

        // Calcular distâncias entre todos os pares de pontos
        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                if (i === j) {
                    distances[i][j] = 0 // Distância de um ponto para ele mesmo é 0
                } else {
                    // Calcular distância usando a função especificada
                    const distance = calculateDistance(
                        embeddings[i],
                        embeddings[j],
                        distanceFunction
                    )
                    distances[i][j] = distance
                    distances[j][i] = distance // A matriz é simétrica
                }
            }
        }

        return distances
    }

    /**
     * Encontra todos os pontos na vizinhança de um ponto específico
     *
     * @param pointIdx Índice do ponto central
     * @param distances Matriz de distâncias
     * @param epsilon Raio da vizinhança
     * @returns Índices dos pontos vizinhos (incluindo o próprio ponto)
     */
    private findNeighbors(pointIdx: number, distances: number[][], epsilon: number): number[] {
        const n = distances.length
        const neighbors: number[] = []

        // Incluir todos os pontos com distância <= epsilon
        for (let i = 0; i < n; i++) {
            if (distances[pointIdx][i] <= epsilon) {
                neighbors.push(i)
            }
        }

        return neighbors
    }

    /**
     * Prepara o resultado final da clusterização
     *
     * @param embeddings Vetores de embedding
     * @param entities Entidades correspondentes
     * @param clusterLabels Rótulos de cluster atribuídos a cada ponto
     * @param noise Índices dos pontos de ruído
     * @param config Configuração do DBSCAN
     * @returns Resultado formatado da clusterização
     */
    private prepareClusteringResult(
        embeddings: number[][],
        entities: Entity[],
        clusterLabels: number[],
        noise: number[],
        config: DBSCANConfig
    ): ClusteringResult {
        // Mapear cada entidade para seu cluster
        const clusterMap = new Map<number, { entities: Entity[]; embeddings: number[][] }>()

        // Agrupar entidades por cluster
        clusterLabels.forEach((clusterId, idx) => {
            if (clusterId >= 0) {
                // Pontos atribuídos a clusters
                if (!clusterMap.has(clusterId)) {
                    clusterMap.set(clusterId, { entities: [], embeddings: [] })
                }
                clusterMap.get(clusterId)!.entities.push(entities[idx])
                clusterMap.get(clusterId)!.embeddings.push(embeddings[idx])
            }
        })

        // Se configurado para tratar ruído como cluster separado
        if (config.noiseHandling === "separate-cluster" && noise.length > 0) {
            const noiseClusterId = Math.max(...clusterLabels) + 1
            clusterMap.set(noiseClusterId, {
                entities: noise.map((idx) => entities[idx]),
                embeddings: noise.map((idx) => embeddings[idx]),
            })
        }

        // Construir clusters a partir dos dados agrupados
        const clusters: Cluster[] = []
        const assignments: Record<string, number> = {}

        clusterMap.forEach((data, clusterId) => {
            // Calcular centroide do cluster (média dos embeddings)
            const centroid = this.calculateCentroid(data.embeddings)

            // Criar referências para membros do cluster
            const members = data.entities.map((entity) => ({
                id: entity.id,
                type: entity.type,
                weight: 1.0, // No DBSCAN, todos os pontos têm peso igual no cluster
                creatorId: entity.metadata?.creatorId,
            }))

            // Calcular métricas do cluster
            const metrics = this.calculateClusterMetrics(data.embeddings, centroid)

            // Calcular raio do cluster (máxima distância do centroide a qualquer ponto)
            const maxDistance = Math.max(
                ...data.embeddings.map((emb) => calculateDistance(emb, centroid, "euclidean"))
            )

            // Criar objeto do cluster
            const cluster: Cluster = {
                id: `dbscan-${clusterId}`,
                type: data.entities[0].type, // Assume-se que todos os membros são do mesmo tipo
                centroid,
                radius: maxDistance, // Definir o raio como a máxima distância
                members,
                size: members.length,
                createdAt: new Date(),
                updatedAt: new Date(),
                metrics,
                metadata: {
                    algorithm: "dbscan",
                    isNoiseCluster:
                        noise.length > 0 && clusterId === Math.max(...clusterLabels) + 1,
                    maxDistance,
                },
            }

            clusters.push(cluster)

            // Registrar atribuições de entidades a clusters
            data.entities.forEach((entity) => {
                assignments[String(entity.id)] = clusters.length - 1
            })
        })

        // Calcular qualidade geral do clustering
        const qualityScore = this.calculateQualityScore(clusters, embeddings)

        // Formatar resultado final
        return {
            clusters: clusters.map((cluster) => this.createClusterInfo(cluster)),
            assignments,
            quality: qualityScore,
            metadata: {
                algorithm: "dbscan",
                epsilon: config.epsilon,
                minPoints: config.minPoints,
                noisePoints: noise.length,
                distanceFunction: config.distanceFunction,
            },
        }
    }

    /**
     * Calcula o centroide (média) de um conjunto de embeddings
     *
     * @param embeddings Lista de embeddings
     * @returns Vetor centroide
     */
    private calculateCentroid(embeddings: number[][]): number[] {
        if (embeddings.length === 0) {
            return []
        }

        const dimension = embeddings[0].length
        const centroid = new Array(dimension).fill(0)

        // Somar todos os embeddings
        for (const embedding of embeddings) {
            for (let i = 0; i < dimension; i++) {
                centroid[i] += embedding[i]
            }
        }

        // Calcular a média
        for (let i = 0; i < dimension; i++) {
            centroid[i] /= embeddings.length
        }

        // Normalizar o centroide
        return normalizeVector(centroid)
    }

    /**
     * Calcula métricas para um cluster
     *
     * @param embeddings Embeddings dos membros do cluster
     * @param centroid Centroide do cluster
     * @returns Métricas do cluster
     */
    private calculateClusterMetrics(embeddings: number[][], centroid: number[]): ClusterMetrics {
        // Calcular distâncias de cada ponto ao centroide
        const distances = embeddings.map((embedding) =>
            calculateDistance(embedding, centroid, "euclidean")
        )

        // Distância média ao centroide
        const avgDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length

        // Coesão = medida de quão próximos estão os pontos (valor entre 0 e 1)
        const maxPossibleDistance = Math.sqrt(centroid.length) // Distância euclidiana máxima teórica
        const cohesion = 1 - avgDistance / maxPossibleDistance

        // Calcular densidade do cluster (inversamente proporcional à distância média)
        const density =
            embeddings.length > 0
                ? embeddings.length / (Math.pow(avgDistance, centroid.length) + 0.0001)
                : 0

        return {
            cohesion: Math.max(0, Math.min(1, cohesion)), // Limitar entre 0 e 1
            stability: 1.0, // DBSCAN é determinístico, então estabilidade é máxima
            growth: 0.0, // Valor inicial para crescimento
            density: density, // Adicionar cálculo de densidade
        } as DBSCANClusterMetrics
    }

    /**
     * Calcula pontuação de qualidade geral para os clusters
     *
     * @param clusters Lista de clusters
     * @param embeddings Todos os embeddings
     * @returns Pontuação de qualidade (0-1)
     */
    private calculateQualityScore(clusters: Cluster[], embeddings: number[][]): number {
        if (clusters.length === 0 || embeddings.length === 0) {
            return 0
        }

        // 1. Fator de cobertura: proporção de pontos em clusters (não-ruído)
        const totalPointsInClusters = clusters.reduce((sum, cluster) => sum + cluster.size, 0)
        const coverageRatio = totalPointsInClusters / embeddings.length

        // 2. Fator de coesão: média da coesão dos clusters, ponderada pelo tamanho
        let weightedCohesionSum = 0
        for (const cluster of clusters) {
            weightedCohesionSum += cluster.metrics.cohesion * cluster.size
        }
        const avgCohesion = weightedCohesionSum / totalPointsInClusters

        // 3. Fator de separação: baseado no número de clusters em relação ao número de pontos
        // (heurística: um bom agrupamento tem número razoável de clusters)
        const idealClusterRatio = 0.1 // 10% do número de pontos como ideal (heurística)
        const actualClusterRatio = clusters.length / embeddings.length
        const separationFactor =
            1 - Math.min(1, Math.abs(actualClusterRatio - idealClusterRatio) / idealClusterRatio)

        // Combinar os fatores com pesos
        const quality = coverageRatio * 0.4 + avgCohesion * 0.4 + separationFactor * 0.2

        return Math.max(0, Math.min(1, quality))
    }

    /**
     * Converte um objeto Cluster para o formato ClusterInfo
     *
     * @param cluster Objeto Cluster completo
     * @returns Objeto ClusterInfo com informações essenciais
     */
    private createClusterInfo(cluster: Cluster): ClusterInfo {
        return {
            id: cluster.id,
            name: `Cluster ${cluster.id.split("-")[1]}`,
            centroid: {
                dimension: cluster.centroid.length,
                values: cluster.centroid,
                createdAt: cluster.createdAt,
                updatedAt: cluster.updatedAt,
            },
            topics: (cluster.metadata?.topics as string[]) || [],
            memberIds: cluster.members.map((m) => String(m.id)),
            size: cluster.size,
            density: (cluster.metrics as DBSCANClusterMetrics).density || 0,
            metadata: {
                algorithm: "dbscan",
                isNoiseCluster: cluster.metadata?.isNoiseCluster || false,
                radius: cluster.radius,
                cohesion: cluster.metrics.cohesion,
            },
        }
    }

    /**
     * Treinamento do modelo DBSCAN com dados de treinamento
     *
     * @param data Dados para treinamento
     * @param config Configuração opcional
     * @returns Resultado do clustering
     */
    async train(
        data: ClusteringTrainingData,
        config?: Partial<DBSCANConfig>
    ): Promise<ClusteringResult> {
        this.logger.info(`Treinando DBSCAN com ${data.ids.length} exemplos`)

        // Preparar entidades a partir dos IDs
        const entities = data.ids.map((id, idx) => {
            return {
                id,
                type: "user" as const, // Assumindo que são usuários, mas poderia ser inferido
                metadata: data.metadata?.[id],
            }
        })

        // Executar clustering com os dados fornecidos
        return this.cluster(data.vectors, entities, config)
    }
}
