import { beforeEach, describe, expect, test, vi } from "vitest"
import { ClusterInfo, UserEmbedding, UserProfile, RecommendationContext, EmbeddingVector } from "../../types"
import { ClusterMatcher } from "../ClusterMatcher"

// Mock para o logger
vi.mock("../../utils/logger", () => ({
    getLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
    }),
}))

// Auxiliar para criar um embedding de teste
function createTestEmbedding(values: number[]): EmbeddingVector {
    return {
        dimension: values.length,
        values,
        createdAt: new Date(),
        updatedAt: new Date()
    }
}

// Auxiliar para criar um cluster de teste
function createTestCluster(
    id: string,
    name: string,
    size: number,
    density: number = 0.5,
    topics: string[] = [],
    activeTimeOfDay?: [number, number]
): ClusterInfo {
    return {
        id,
        name,
        centroid: createTestEmbedding([0.1 * size, 0.2 * size, 0.3 * size]),
        memberIds: Array(size).fill("").map((_, i) => `user_${id}_${i}`),
        density,
        topics: topics.length > 0 ? topics : [`topic_${id}_1`, `topic_${id}_2`],
        activeTimeOfDay
    }
}

// Auxiliar para criar um UserEmbedding de teste
function createTestUserEmbedding(values: number[]): UserEmbedding {
    const embeddingVector: EmbeddingVector = {
        dimension: values.length,
        values,
        createdAt: new Date(),
        updatedAt: new Date()
    }
    
    return {
        userId: "123",
        vector: embeddingVector
    }
}

describe("ClusterMatcher", () => {
    let clusters: ClusterInfo[]
    let clusterMatcher: ClusterMatcher

    beforeEach(() => {
        // Preparar dados de teste com clusters mais diversificados
        clusters = [
            createTestCluster("1", "Cluster Pequeno", 10, 0.8, 
                ["tecnologia", "programação"],
                [6, 12] // manhã
            ),
            createTestCluster("2", "Cluster Médio 1", 50, 0.6,
                ["esportes", "futebol"],
                [18, 23] // noite
            ),
            createTestCluster("3", "Cluster Médio 2", 60, 0.5,
                ["música", "rock"],
                [23, 6] // madrugada
            ),
            createTestCluster("4", "Cluster Grande 1", 200, 0.3,
                ["games", "e-sports"],
                [6, 12] // manhã
            ),
            createTestCluster("5", "Cluster Grande 2", 250, 0.35,
                ["cinema", "filmes"],
                [12, 18] // tarde
            ),
            createTestCluster("6", "Cluster Grande 3", 180, 0.4,
                ["comida", "culinária"],
                [18, 23] // noite
            ),
        ]

        clusterMatcher = new ClusterMatcher(clusters, {
            maxClusters: 3,
            minMatchThreshold: 0.2,
            contextWeight: 0.2,
            interestWeight: 0.3,
            embeddingWeight: 0.5
        })
    })

    describe("getClusterStats", () => {
    test("deve retornar estatísticas corretas dos clusters", () => {
        const stats = clusterMatcher.getClusterStats()

        expect(stats.count).toBe(6)
        expect(stats.totalMembers).toBe(750)
        expect(stats.sizeStats.avgSize).toBe(125)
        expect(stats.densityStats.hasDensityInfo).toBe(true)
            expect(stats.sizeDistribution.small).toBe(1)
            expect(stats.sizeDistribution.medium).toBe(2)
            expect(stats.sizeDistribution.large).toBe(3)
            expect(stats.topicStats.uniqueTopicsCount).toBeGreaterThan(0)
    })

        test("deve lidar corretamente com lista vazia de clusters", () => {
            clusterMatcher.updateClusters([])
            const stats = clusterMatcher.getClusterStats()

            expect(stats.isEmpty).toBe(true)
            expect(stats.count).toBe(0)
            expect(stats.message).toBe("Nenhum cluster disponível")
        })
    })

    describe("findRelevantClusters", () => {
        test("deve encontrar clusters relevantes com base no embedding do usuário", () => {
            const userEmbedding = createTestUserEmbedding([0.3, 0.6, 0.9])

            const userProfile: UserProfile = {
                userId: "123",
                interests: ["tecnologia", "games"]
            }

            const context: RecommendationContext = {
                timeOfDay: 8, // manhã
                location: "São Paulo"
            }

            const matchResults = clusterMatcher.findRelevantClusters(userEmbedding, userProfile, context)

            expect(matchResults.length).toBeLessThanOrEqual(3)
            expect(matchResults[0].similarity).toBeGreaterThanOrEqual(matchResults[matchResults.length - 1].similarity)
            
            // Verificar se os clusters mais relevantes são retornados
            const resultIds = matchResults.map(r => r.clusterId)
            expect(resultIds).toContain("1") // Cluster de tecnologia
            expect(resultIds).toContain("4") // Cluster de games
        })

        test("deve usar perfil do usuário quando embedding não está disponível", () => {
            const userProfile: UserProfile = {
                userId: "123",
                interests: ["música", "rock"]
            }

            const context: RecommendationContext = {
                timeOfDay: 23, // noite
                location: "Belo Horizonte"
            }

            const matchResults = clusterMatcher.findRelevantClusters(null, userProfile, context)

            expect(matchResults.length).toBeLessThanOrEqual(3)
            expect(matchResults[0].clusterId).toBe("3") // Cluster de música em BH
        })

        test("deve considerar fatores contextuais na recomendação", () => {
            const userEmbedding = createTestUserEmbedding([0.5, 0.5, 0.5]) // Embedding neutro

            const context: RecommendationContext = {
                timeOfDay: 20, // noite
                location: "Rio de Janeiro"
            }

            const matchResults = clusterMatcher.findRelevantClusters(userEmbedding, null, context)

            // O cluster 2 (esportes no Rio) deve ter prioridade devido ao contexto
            expect(matchResults[0].clusterId).toBe("2")
        })

        test("deve respeitar o limite máximo de clusters", () => {
            const userEmbedding = createTestUserEmbedding([0.5, 0.5, 0.5])

            const matchResults = clusterMatcher.findRelevantClusters(userEmbedding)

            expect(matchResults.length).toBeLessThanOrEqual(3)
        })

        test("deve filtrar clusters abaixo do threshold mínimo", () => {
            // Criar um matcher com threshold alto
            const highThresholdMatcher = new ClusterMatcher(clusters, {
                minMatchThreshold: 0.8,
                maxClusters: 3
            })

            const userEmbedding = createTestUserEmbedding([0.1, 0.1, 0.1]) // Embedding muito diferente dos clusters

            const matchResults = highThresholdMatcher.findRelevantClusters(userEmbedding)

            // Como o threshold é alto, nenhum cluster deve passar
            expect(matchResults.length).toBe(0)
        })
    })

    describe("updateClusters", () => {
    test("deve atualizar clusters corretamente", () => {
        const newClusters = [
                createTestCluster("7", "Novo Cluster 1", 100, 0.7),
                createTestCluster("8", "Novo Cluster 2", 120, 0.6)
        ]

        clusterMatcher.updateClusters(newClusters)

        const stats = clusterMatcher.getClusterStats()
        expect(stats.count).toBe(2)
        expect(stats.totalMembers).toBe(220)
    })

        test("deve manter configurações ao atualizar clusters", () => {
            const originalOptions = {
                maxClusters: 5,
                minMatchThreshold: 0.3,
                contextWeight: 0.4,
                interestWeight: 0.3,
                embeddingWeight: 0.3
            }

            const customMatcher = new ClusterMatcher(clusters, originalOptions)
            customMatcher.updateClusters([])

            // Verificar se as opções foram mantidas
            const matchResults = customMatcher.findRelevantClusters(null)
            expect(matchResults.length).toBeLessThanOrEqual(originalOptions.maxClusters)
        })
    })
})
