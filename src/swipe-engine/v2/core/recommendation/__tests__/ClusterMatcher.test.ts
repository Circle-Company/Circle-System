import { beforeEach, describe, expect, test, vi } from "vitest"
import { ClusterInfo, UserEmbedding, UserProfile } from "../../types"
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

// Auxiliar para criar um cluster de teste
function createTestCluster(id: string, name: string, size: number, density?: number): ClusterInfo {
    return {
        id,
        name,
        centroid: {
            dimension: 3,
            values: [0.1 * size, 0.2 * size, 0.3 * size],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        topics: [`topic_${id}_1`, `topic_${id}_2`],
        size,
        density,
        metadata: {},
    } as ClusterInfo
}

describe("ClusterMatcher", () => {
    let clusters: ClusterInfo[]
    let clusterMatcher: ClusterMatcher

    beforeEach(() => {
        // Preparar dados de teste
        clusters = [
            createTestCluster("1", "Pequeno", 10, 0.8), // Pequeno mas denso
            createTestCluster("2", "Médio 1", 50, 0.6), // Médio com densidade média
            createTestCluster("3", "Médio 2", 60, 0.5), // Médio com densidade média
            createTestCluster("4", "Grande 1", 200, 0.3), // Grande com baixa densidade
            createTestCluster("5", "Grande 2", 250, 0.35), // Grande com baixa densidade
            createTestCluster("6", "Grande 3", 180, 0.4), // Grande com densidade média
        ]

        clusterMatcher = new ClusterMatcher(clusters, {
            maxClusters: 3,
        })
    })

    test("deve retornar estatísticas corretas dos clusters", () => {
        const stats = clusterMatcher.getClusterStats()

        expect(stats.count).toBe(6)
        expect(stats.totalMembers).toBe(750)
        expect(stats.sizeStats.avgSize).toBe(125)
        expect(stats.densityStats.hasDensityInfo).toBe(true)
        expect(stats.sizeDistribution.small).toBe(1) // Cluster de tamanho 10
        expect(stats.sizeDistribution.medium).toBe(2) // Clusters de tamanho 50 e 60
        expect(stats.sizeDistribution.large).toBe(3) // Clusters de tamanho 180, 200, 250
    })

    test("deve selecionar clusters padrão com base no tamanho e densidade", () => {
        const matchResults = (clusterMatcher as any).getDefaultClusters()

        // Deve retornar exatamente maxClusters clusters
        expect(matchResults.length).toBe(3)

        // Deve conter pelo menos um cluster de cada categoria (já que temos 3 slots)
        const resultIds = matchResults.map((r: any) => r.clusterId)

        // Verificar que a maioria são grandes
        const largeClusterIds = ["4", "5", "6"]
        const largeCount = resultIds.filter((id: string) => largeClusterIds.includes(id)).length
        expect(largeCount).toBeGreaterThanOrEqual(1)

        // Verificar que todos os resultados são diferentes
        const uniqueIds = new Set(resultIds)
        expect(uniqueIds.size).toBe(3)

        // Verificar que todos têm similaridade neutra
        matchResults.forEach((match: any) => {
            expect(match.similarity).toBe(0.5)
        })
    })

    test("deve atualizar clusters corretamente", () => {
        const newClusters = [
            createTestCluster("7", "Novo 1", 100),
            createTestCluster("8", "Novo 2", 120),
        ]

        clusterMatcher.updateClusters(newClusters)

        const stats = clusterMatcher.getClusterStats()
        expect(stats.count).toBe(2)
        expect(stats.totalMembers).toBe(220)
    })

    test("deve tratar corretamente o caso de lista de clusters vazia", () => {
        clusterMatcher.updateClusters([])

        const stats = clusterMatcher.getClusterStats()
        expect(stats.isEmpty).toBe(true)
        expect(stats.count).toBe(0)

        const matchResults = (clusterMatcher as any).getDefaultClusters()
        expect(matchResults).toEqual([])
    })

    test("deve encontrar clusters relevantes com base no embedding do usuário", () => {
        // Criar um embedding para um usuário fictício
        const userEmbedding: UserEmbedding = {
            userId: "123",
            vector: {
                dimension: 3,
                values: [0.3, 0.6, 0.9], // mais próximo dos clusters grandes
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            metadata: {},
        }

        // Criar perfil de usuário com interesses
        const userProfile: UserProfile = {
            userId: "123",
            interests: ["topic_5_1", "topic_6_2"], // Interesses que batem com clusters 5 e 6
        }

        // Obter recomendações
        const matchResults = clusterMatcher.findRelevantClusters(userEmbedding, userProfile)

        // Verificar resultados
        expect(matchResults.length).toBeGreaterThan(0)
        expect(matchResults.length).toBeLessThanOrEqual(3) // maxClusters = 3

        // Os clusters 5 e 6 devem estar entre os mais similares devido aos interesses
        const resultIds = matchResults.map((r) => r.clusterId)
        const hasPreferredCluster = resultIds.some((id) => ["5", "6"].includes(id))
        expect(hasPreferredCluster).toBe(true)

        // Verificar que os resultados estão ordenados por similaridade
        for (let i = 1; i < matchResults.length; i++) {
            expect(matchResults[i - 1].similarity).toBeGreaterThanOrEqual(
                matchResults[i].similarity
            )
        }
    })

    test("deve recorrer ao perfil do usuário quando embedding não está disponível", () => {
        // Criar perfil de usuário com interesses
        const userProfile: UserProfile = {
            userId: "123",
            interests: ["topic_1_1", "topic_2_2"], // Interesses que batem com clusters 1 e 2
        }

        // Obter recomendações sem embedding
        const matchResults = clusterMatcher.findRelevantClusters(null, userProfile)

        // Verificar resultados
        expect(matchResults.length).toBeGreaterThan(0)
        expect(matchResults.length).toBeLessThanOrEqual(3) // maxClusters = 3

        // Os interesses devem influenciar os resultados
        const resultIds = matchResults.map((r) => r.clusterId)
        const hasMatchingCluster = resultIds.some((id) => ["1", "2"].includes(id))
        expect(hasMatchingCluster).toBe(true)
    })
})
