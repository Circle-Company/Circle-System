/**
 * Implementação do algoritmo de clustering K-means
 */

import { v4 as uuidv4 } from "uuid"
import {
    Cluster,
    ClusterConfig,
    ClusterInfo,
    ClusteringConfig,
    ClusteringResult,
    ClusteringTrainingData,
    ClusterMetrics,
    Entity,
    EntityReference,
    EntityType,
} from "../types"
import { getLogger } from "../utils/logger"
import { calculateDistance, createEmbeddingVector, euclideanDistance } from "../utils/vectorUtils"

/**
 * Implementação do algoritmo K-means para clustering de entidades com base em seus embeddings.
 *
 * O K-means agrupa entidades em K clusters, onde K é um número predefinido.
 * Cada cluster é representado por um centróide, e as entidades são associadas
 * ao cluster cujo centróide está mais próximo.
 */
export class KMeansClustering {
    public readonly name = "kmeans"
    private readonly logger = getLogger("KMeansClustering")
    private readonly defaultConfig: ClusteringConfig = {
        numClusters: 10,
        maxIterations: 100,
        convergenceThreshold: 0.001,
        outlierStrategy: "nearest-cluster", // Corrigido para valor válido
        initMethod: "random", // Corrigido para valor válido
    }

    /**
     * Realiza o clustering das entidades usando o algoritmo K-means.
     *
     * @param embeddings - Matriz de embeddings, onde cada linha representa uma entidade
     * @param entities - Array de entidades correspondentes aos embeddings
     * @param config - Configuração do algoritmo de clustering
     * @returns Promise resolvendo para um array de clusters
     */
    public async cluster(
        embeddings: number[][],
        entities: Entity[],
        config: ClusterConfig
    ): Promise<Cluster[]> {
        const { numClusters = 10, maxIterations = 100, distanceFunction = "euclidean" } = config

        // Outros parâmetros que precisamos mas não estão definidos na interface ClusterConfig
        const randomSeed = 42
        const initMethod = "random"

        if (entities.length === 0 || embeddings.length === 0) {
            return []
        }

        if (entities.length !== embeddings.length) {
            throw new Error("O número de embeddings deve ser igual ao número de entidades")
        }

        const embeddingDimension = embeddings[0].length

        // Inicialização dos centróides
        let centroids: number[][] = this.initializeCentroids(
            embeddings,
            numClusters,
            initMethod,
            randomSeed
        )

        let previousAssignments: number[] = Array(embeddings.length).fill(-1)
        let currentAssignments: number[] = Array(embeddings.length).fill(-1)
        let iterations = 0
        let converged = false

        // Iterações do K-means
        while (!converged && iterations < maxIterations) {
            // Atribuição: associar cada entidade ao centróide mais próximo
            currentAssignments = this.assignToClusters(embeddings, centroids, distanceFunction)

            // Atualização: recalcular posições dos centróides
            centroids = this.updateCentroids(embeddings, currentAssignments, numClusters)

            // Verificar convergência
            converged = this.checkConvergence(previousAssignments, currentAssignments)
            previousAssignments = [...currentAssignments]
            iterations++
        }

        // Formar clusters a partir das atribuições finais
        return this.formClusters(
            embeddings,
            entities,
            currentAssignments,
            centroids,
            distanceFunction
        )
    }

    /**
     * Treina o algoritmo K-Means com os dados fornecidos
     * @param data - Dados de treinamento para o clustering
     * @param config - Configuração opcional para o algoritmo
     * @returns Resultado do processo de clustering
     */
    async train(
        data: ClusteringTrainingData,
        config?: Partial<ClusteringConfig>
    ): Promise<ClusteringResult> {
        const startTime = Date.now()

        // Mesclar configuração padrão com a fornecida
        const fullConfig: ClusteringConfig = {
            ...this.defaultConfig,
            ...config,
        }

        // Extrair os vetores dos dados de treinamento
        const vectors = data.vectors || []

        this.logger.info(
            `Iniciando treinamento K-Means com ${vectors.length} itens e ${fullConfig.numClusters} clusters`
        )

        // Verificar se temos dados suficientes
        if (vectors.length < (fullConfig.numClusters || 1)) {
            this.logger.warn(
                `Quantidade de dados (${vectors.length}) menor que o número de clusters (${fullConfig.numClusters})`
            )
            fullConfig.numClusters = Math.max(1, Math.floor(vectors.length / 2))
            this.logger.info(`Ajustando número de clusters para ${fullConfig.numClusters}`)
        }

        // Inicializar centroides (com valores padrão para garantir chamada correta)
        let centroids = this.initializeCentroids(
            vectors,
            fullConfig.numClusters || 10,
            fullConfig.initMethod || "random",
            42
        )

        // Armazenar atribuições de cada ponto a um cluster
        let assignments: number[] = Array(vectors.length).fill(-1)
        let previousAssignments: number[] = Array(vectors.length).fill(-1)

        // Informações adicionais para o resultado
        let iterations = 0
        let hasConverged = false

        // Loop principal do K-Means
        while (iterations < (fullConfig.maxIterations || 100) && !hasConverged) {
            // Atribuir cada ponto ao centroide mais próximo
            previousAssignments = [...assignments]

            for (let i = 0; i < vectors.length; i++) {
                // Aqui usamos adaptador para encontrar o centroide mais próximo
                assignments[i] = this.findNearestCentroidIndex(vectors[i], centroids)
            }

            // Verificar convergência
            let assignmentChanges = 0
            for (let i = 0; i < assignments.length; i++) {
                if (assignments[i] !== previousAssignments[i]) {
                    assignmentChanges++
                }
            }

            // Decidir se convergiu
            const changeRatio = assignmentChanges / assignments.length
            hasConverged = changeRatio < (fullConfig.convergenceThreshold || 0.001)

            this.logger.debug(
                `Iteração ${iterations + 1}: ${assignmentChanges} mudanças (${(
                    changeRatio * 100
                ).toFixed(2)}%)`
            )

            // Se não convergiu, recalcular centroides
            if (!hasConverged) {
                centroids = this.updateCentroids(vectors, assignments, fullConfig.numClusters || 10)
            }

            iterations++
        }

        // Montar clusters finais
        const clusterInfos: ClusterInfo[] = this.buildClusterInfos(
            data.ids || [],
            vectors,
            assignments,
            centroids
        )

        // Calcular score de qualidade
        const qualityScore = this.calculateQualityScore(vectors, assignments, centroids)

        const elapsedTime = Date.now() - startTime

        this.logger.info(
            `Treinamento K-Means concluído em ${elapsedTime}ms após ${iterations} iterações`
        )

        // Converter assignments para o formato esperado
        const assignmentMap: Record<string, number> = {}
        for (let i = 0; i < data.ids.length; i++) {
            assignmentMap[data.ids[i]] = assignments[i]
        }

        return {
            clusters: clusterInfos,
            assignments: assignmentMap,
            quality: qualityScore,
            elapsedTime,
            iterations,
            converged: hasConverged,
        }
    }

    /**
     * Inicializa os centróides dos clusters.
     *
     * @param embeddings - Matriz de embeddings
     * @param numClusters - Número de clusters a serem formados
     * @param initMethod - Método de inicialização ('random' ou 'kmeans++')
     * @param randomSeed - Seed para geração de números aleatórios
     * @returns Array de centróides iniciais
     */
    private initializeCentroids(
        embeddings: number[][],
        numClusters: number,
        initMethod: string,
        randomSeed: number
    ): number[][] {
        if (numClusters >= embeddings.length) {
            // Se houver mais clusters que pontos, cada ponto é seu próprio cluster
            return [...embeddings]
        }

        if (initMethod === "k-means++") {
            return this.kmeansppInitialization(embeddings, numClusters)
        } else {
            // Inicialização aleatória
            const centroids: number[][] = []
            const embeddingIndices = new Set<number>()

            // Seed para pseudorandom
            const prng = this.createPRNG(randomSeed)

            while (centroids.length < numClusters) {
                const index = Math.floor(prng() * embeddings.length)
                if (!embeddingIndices.has(index)) {
                    embeddingIndices.add(index)
                    centroids.push([...embeddings[index]])
                }
            }

            return centroids
        }
    }

    /**
     * Inicialização de centróides usando o algoritmo k-means++.
     *
     * @param embeddings - Matriz de embeddings
     * @param numClusters - Número de clusters a serem formados
     * @returns Array de centróides iniciais
     */
    private kmeansppInitialization(embeddings: number[][], numClusters: number): number[][] {
        const centroids: number[][] = []

        // Escolher o primeiro centróide aleatoriamente
        const firstIndex = Math.floor(Math.random() * embeddings.length)
        centroids.push([...embeddings[firstIndex]])

        // Escolher os demais centróides
        for (let k = 1; k < numClusters; k++) {
            // Calcular distâncias ao quadrado para o centróide mais próximo
            const distances = embeddings.map((embedding) => {
                const minDistance = Math.min(
                    ...centroids.map(
                        (centroid) => calculateDistance(embedding, centroid, "euclidean") ** 2
                    )
                )
                return minDistance
            })

            // Calcular a soma das distâncias
            const sumDistances = distances.reduce((sum, dist) => sum + dist, 0)

            // Escolher o próximo centróide com probabilidade proporcional à distância ao quadrado
            let random = Math.random() * sumDistances
            let index = 0

            for (let i = 0; i < distances.length; i++) {
                random -= distances[i]
                if (random <= 0) {
                    index = i
                    break
                }
            }

            centroids.push([...embeddings[index]])
        }

        return centroids
    }

    /**
     * Atribui cada entidade ao cluster cujo centróide está mais próximo.
     *
     * @param embeddings - Matriz de embeddings
     * @param centroids - Array de centróides dos clusters
     * @param distanceFunction - Função de distância a ser utilizada
     * @returns Array de índices de clusters atribuídos a cada entidade
     */
    private assignToClusters(
        embeddings: number[][],
        centroids: number[][],
        distanceFunction: string
    ): number[] {
        return embeddings.map((embedding) => {
            let minDistance = Infinity
            let closestClusterIndex = -1

            for (let i = 0; i < centroids.length; i++) {
                const distance = calculateDistance(embedding, centroids[i], distanceFunction)
                if (distance < minDistance) {
                    minDistance = distance
                    closestClusterIndex = i
                }
            }

            return closestClusterIndex
        })
    }

    /**
     * Atualiza as posições dos centróides com base nas novas atribuições.
     *
     * @param embeddings - Matriz de embeddings
     * @param assignments - Array de atribuições de cluster para cada entidade
     * @param numClusters - Número de clusters
     * @returns Array de centróides atualizados
     */
    private updateCentroids(
        embeddings: number[][],
        assignments: number[],
        numClusters: number
    ): number[][] {
        const dimension = embeddings[0].length
        const centroids: number[][] = Array(numClusters)
            .fill(0)
            .map(() => Array(dimension).fill(0))
        const counts: number[] = Array(numClusters).fill(0)

        // Somar todos os embeddings para cada cluster
        for (let i = 0; i < embeddings.length; i++) {
            const clusterIndex = assignments[i]
            counts[clusterIndex]++

            for (let d = 0; d < dimension; d++) {
                centroids[clusterIndex][d] += embeddings[i][d]
            }
        }

        // Dividir pela contagem para obter a média (centróide)
        for (let i = 0; i < numClusters; i++) {
            if (counts[i] > 0) {
                for (let d = 0; d < dimension; d++) {
                    centroids[i][d] /= counts[i]
                }
            }
        }

        return centroids
    }

    /**
     * Verifica se o algoritmo convergiu comparando as atribuições atuais e anteriores.
     *
     * @param previous - Atribuições de cluster anteriores
     * @param current - Atribuições de cluster atuais
     * @returns Verdadeiro se as atribuições não mudaram (convergiu)
     */
    private checkConvergence(previous: number[], current: number[]): boolean {
        for (let i = 0; i < current.length; i++) {
            if (previous[i] !== current[i]) {
                return false
            }
        }
        return true
    }

    /**
     * Forma os clusters finais a partir das atribuições.
     *
     * @param embeddings - Matriz de embeddings
     * @param entities - Array de entidades
     * @param assignments - Atribuições finais de cluster
     * @param centroids - Centróides finais
     * @param distanceFunction - Função de distância utilizada
     * @returns Array de clusters formados
     */
    private formClusters(
        embeddings: number[][],
        entities: Entity[],
        assignments: number[],
        centroids: number[][],
        distanceFunction: string
    ): Cluster[] {
        const entityType = entities.length > 0 ? entities[0].type : ("user" as EntityType)
        const clusters: Cluster[] = []

        // Inicializar clusters vazios
        for (let i = 0; i < centroids.length; i++) {
            clusters.push({
                id: uuidv4(),
                type: entityType,
                centroid: centroids[i],
                radius: 0,
                members: [],
                size: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                metrics: this.initializeClusterMetrics(),
                metadata: {},
            })
        }

        // Adicionar entidades aos clusters correspondentes
        for (let i = 0; i < entities.length; i++) {
            const clusterIndex = assignments[i]

            if (clusterIndex >= 0) {
                const cluster = clusters[clusterIndex]
                const distanceValue = calculateDistance(
                    embeddings[i],
                    centroids[clusterIndex],
                    distanceFunction
                )

                const entityRef: EntityReference = {
                    id: entities[i].id,
                    type: entities[i].type,
                    weight: 1.0, // Peso padrão de associação
                }

                // Armazenar a distância como metadado
                cluster.members.push(entityRef)

                // Atualizar raio do cluster (maior distância entre membro e centróide)
                if (distanceValue > cluster.radius) {
                    cluster.radius = distanceValue
                }

                cluster.size++
            }
        }

        // Calcular métricas para cada cluster
        for (const cluster of clusters) {
            cluster.metrics = this.calculateClusterMetrics(
                cluster,
                embeddings,
                assignments,
                centroids
            )
        }

        // Retornar apenas clusters não vazios
        return clusters.filter((cluster) => cluster.size > 0)
    }

    /**
     * Inicializa as métricas de um cluster.
     *
     * @returns Objeto com métricas inicializadas
     */
    private initializeClusterMetrics(): ClusterMetrics {
        return {
            cohesion: 0,
            stability: 0,
            growth: 0,
        }
    }

    /**
     * Calcula métricas para um cluster.
     *
     * @param cluster - Cluster a ser analisado
     * @param embeddings - Matriz de embeddings
     * @param assignments - Atribuições de cluster
     * @param centroids - Centróides dos clusters
     * @returns Objeto com métricas do cluster
     */
    private calculateClusterMetrics(
        cluster: Cluster,
        embeddings: number[][],
        assignments: number[],
        centroids: number[][]
    ): ClusterMetrics {
        // Encontrar índices das entidades neste cluster
        const clusterMemberIndices: number[] = []
        for (let i = 0; i < assignments.length; i++) {
            if (assignments[i] === centroids.indexOf(cluster.centroid)) {
                clusterMemberIndices.push(i)
            }
        }

        // Calcular coesão (média das distâncias ao centroide)
        let cohesionSum = 0
        for (const idx of clusterMemberIndices) {
            cohesionSum += calculateDistance(embeddings[idx], cluster.centroid, "euclidean")
        }

        const cohesion =
            cluster.members.length > 0
                ? 1 - cohesionSum / cluster.members.length / Math.max(0.001, cluster.radius)
                : 0

        // Em uma implementação real, calcularíamos a estabilidade ao longo do tempo
        const stability = 0

        // Crescimento é zero para um único clustering
        const growth = 0

        return {
            cohesion: Math.max(0, Math.min(1, cohesion)), // Garantir entre 0 e 1
            stability,
            growth,
        }
    }

    /**
     * Cria um gerador de números pseudoaleatórios com seed.
     *
     * @param seed - Valor inicial da semente
     * @returns Função que gera números pseudoaleatórios entre 0 e 1
     */
    private createPRNG(seed: number): () => number {
        return function () {
            const x = Math.sin(seed++) * 10000
            return x - Math.floor(x)
        }
    }

    /**
     * Encontra o índice do centroide mais próximo de um embedding
     * @param embedding - Embedding para encontrar o cluster mais próximo
     * @param centroids - Lista de centroides
     * @returns Índice do centroide mais próximo
     */
    private findNearestCentroidIndex(embedding: number[], centroids: number[][]): number {
        let nearestIndex = 0
        let minDistance = Number.MAX_VALUE

        for (let i = 0; i < centroids.length; i++) {
            const distance = euclideanDistance(embedding, centroids[i])
            if (distance < minDistance) {
                minDistance = distance
                nearestIndex = i
            }
        }

        return nearestIndex
    }

    /**
     * Constrói os objetos ClusterInfo finais para o resultado do treinamento
     * @param ids - IDs dos itens clusterizados
     * @param vectors - Embeddings dos itens
     * @param assignments - Atribuições finais
     * @param centroids - Centroides finais
     * @returns Array de objetos ClusterInfo
     */
    private buildClusterInfos(
        ids: string[],
        vectors: number[][],
        assignments: number[],
        centroids: number[][]
    ): ClusterInfo[] {
        const clusters: ClusterInfo[] = []

        for (let clusterId = 0; clusterId < centroids.length; clusterId++) {
            // Coletar IDs dos membros
            const memberIds: string[] = []
            for (let i = 0; i < assignments.length && i < ids.length; i++) {
                if (assignments[i] === clusterId) {
                    memberIds.push(ids[i])
                }
            }

            // Criar embedding vector para o centroide
            const centroidVector = createEmbeddingVector(centroids[clusterId])

            // Criar info do cluster
            const cluster: ClusterInfo = {
                id: `cluster-${clusterId}`,
                name: `Cluster ${clusterId}`,
                centroid: centroidVector,
                memberIds,
                size: memberIds.length,
                density: memberIds.length / Math.max(1, vectors.length), // Densidade simples
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            }

            clusters.push(cluster)
        }

        return clusters
    }

    /**
     * Calcula o score de qualidade do clustering (soma das distâncias ao quadrado)
     * @param embeddings - Lista de embeddings
     * @param assignments - Atribuições aos clusters
     * @param centroids - Centroides dos clusters
     * @returns Score de qualidade (menor é melhor)
     */
    private calculateQualityScore(
        embeddings: number[][],
        assignments: number[],
        centroids: number[][]
    ): number {
        let totalSquaredDistance = 0

        for (let i = 0; i < embeddings.length; i++) {
            const clusterId = assignments[i]
            if (clusterId >= 0 && clusterId < centroids.length) {
                const distance = euclideanDistance(embeddings[i], centroids[clusterId])
                totalSquaredDistance += distance * distance
            }
        }

        return totalSquaredDistance
    }
}
