/**
 * Demo de uso do ClusterMatcher
 *
 * Este exemplo demonstra como usar o ClusterMatcher para encontrar clusters relevantes
 * para um usuário com base em seus embeddings, perfil e contexto.
 */

import { ClusterMatcher, createClusterMatcher } from "../core/recommendation"
import { ClusterInfo, RecommendationContext, UserEmbedding, UserProfile } from "../core/types"

// Função auxiliar para criar clusters de teste
function createSampleCluster(
    id: string,
    name: string,
    size: number,
    topics: string[],
    density?: number
): ClusterInfo {
    // Converter o primeiro caractere do ID para número para uso em operações aritméticas
    const idNum = parseInt(id) || 1

    return {
        id,
        name,
        centroid: {
            dimension: 128,
            values: Array(128)
                .fill(0)
                .map((_, i) => (Math.sin(i * idNum) + 1) / 2),
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        topics,
        size,
        density,
        metadata: {},
        preferredLocations: [`city_${idNum % 3}`, `region_${idNum % 5}`],
        languages: [`lang_${idNum % 4}`],
        activeTimeOfDay: [8, 22], // Ativo das 8h às 22h
    } as ClusterInfo
}

// Criar alguns clusters de amostra
const sampleClusters: ClusterInfo[] = [
    createSampleCluster("1", "Tecnologia", 500, ["tech", "programming", "ai"], 0.8),
    createSampleCluster("2", "Esportes", 800, ["sports", "football", "basketball"], 0.6),
    createSampleCluster("3", "Música", 650, ["music", "pop", "rock"], 0.7),
    createSampleCluster("4", "Culinária", 300, ["cooking", "food", "recipes"], 0.5),
    createSampleCluster("5", "Viagens", 450, ["travel", "adventure", "photography"], 0.6),
    createSampleCluster("6", "Moda", 350, ["fashion", "style", "beauty"], 0.4),
    createSampleCluster("7", "Cinema", 550, ["movies", "cinema", "entertainment"], 0.5),
    createSampleCluster("8", "Literatura", 250, ["books", "reading", "literature"], 0.7),
    createSampleCluster("9", "Ciência", 180, ["science", "physics", "biology"], 0.9),
    createSampleCluster("10", "Política", 400, ["politics", "news", "current_events"], 0.3),
]

// Criar um exemplo de embedding de usuário
const sampleUserEmbedding: UserEmbedding = {
    userId: "123",
    vector: {
        dimension: 128,
        values: Array(128)
            .fill(0)
            .map((_, i) => (Math.sin(i * 0.5) + 1) / 2), // Vetor aleatório
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    metadata: {
        lastUpdated: new Date(),
        interactionCount: 58,
        dominantInterests: ["tech", "music", "science"],
    },
}

// Criar um exemplo de perfil de usuário
const sampleUserProfile: UserProfile = {
    userId: "123",
    interests: ["tech", "science", "books", "music"],
    demographics: {
        ageRange: "25-34",
        location: "city_1",
        language: "lang_1",
    },
}

// Criar um contexto de recomendação
const sampleContext: RecommendationContext = {
    timeOfDay: 14, // 14h
    dayOfWeek: 2, // Terça-feira
    location: "city_1",
    language: "lang_1",
    device: "mobile",
}

// Demonstração 1: Uso básico do ClusterMatcher
function demoBasicClusterMatcher() {
    console.log("===== DEMONSTRAÇÃO BÁSICA DO CLUSTERMATCHER =====")

    // Criar instância do ClusterMatcher
    const clusterMatcher = createClusterMatcher(sampleClusters, {
        maxClusters: 3,
    })

    // Obter estatísticas dos clusters
    const stats = clusterMatcher.getClusterStats()
    console.log("Estatísticas de Cluster:")
    console.log(`- Total de clusters: ${stats.count}`)
    console.log(`- Total de membros: ${stats.totalMembers}`)
    console.log(`- Tamanho médio: ${stats.sizeStats.avgSize.toFixed(1)}`)
    console.log(
        `- Distribuição: ${stats.sizeDistribution.small} pequenos, ${stats.sizeDistribution.medium} médios, ${stats.sizeDistribution.large} grandes`
    )
    console.log()

    // Encontrar clusters relevantes com embedding + perfil + contexto
    const relevantClusters = clusterMatcher.findRelevantClusters(
        sampleUserEmbedding,
        sampleUserProfile,
        sampleContext
    )

    console.log("Clusters Relevantes (com embedding + perfil + contexto):")
    relevantClusters.forEach((match, i) => {
        console.log(
            `${i + 1}. ${match.clusterName} (ID: ${
                match.clusterId
            }) - Similaridade: ${match.similarity.toFixed(3)}`
        )
    })
    console.log()
}

// Demonstração 2: Comparar diferentes métodos de recomendação
function demoCompareRecommendationMethods() {
    console.log("===== COMPARAÇÃO DE MÉTODOS DE RECOMENDAÇÃO =====")

    // Criar instância do ClusterMatcher
    const clusterMatcher = createClusterMatcher(sampleClusters, {
        maxClusters: 3,
        embeddingWeight: 0.4,
        contextWeight: 0.3,
        interestWeight: 0.3,
    })

    // Método 1: Apenas com embedding
    const clustersWithEmbedding = clusterMatcher.findRelevantClusters(sampleUserEmbedding)

    // Método 2: Apenas com perfil
    const clustersWithProfile = clusterMatcher.findRelevantClusters(null, sampleUserProfile)

    // Método 3: Método completo (embedding + perfil + contexto)
    const clustersComplete = clusterMatcher.findRelevantClusters(
        sampleUserEmbedding,
        sampleUserProfile,
        sampleContext
    )

    console.log("Método 1 - Apenas Embedding:")
    clustersWithEmbedding.forEach((match, i) => {
        console.log(`${i + 1}. ${match.clusterName} - Similaridade: ${match.similarity.toFixed(3)}`)
    })
    console.log()

    console.log("Método 2 - Apenas Perfil:")
    clustersWithProfile.forEach((match, i) => {
        console.log(`${i + 1}. ${match.clusterName} - Similaridade: ${match.similarity.toFixed(3)}`)
    })
    console.log()

    console.log("Método 3 - Completo (Embedding + Perfil + Contexto):")
    clustersComplete.forEach((match, i) => {
        console.log(`${i + 1}. ${match.clusterName} - Similaridade: ${match.similarity.toFixed(3)}`)
    })
    console.log()
}

// Demonstração 3: Testar a estratégia de diversificação
function demoDiversificationStrategy() {
    console.log("===== ESTRATÉGIA DE DIVERSIFICAÇÃO =====")

    // Criar instância do ClusterMatcher
    const clusterMatcher = new ClusterMatcher(sampleClusters, {
        maxClusters: 5,
    })

    // Acessar o método privado getDefaultClusters via casting
    const defaultClusters = (clusterMatcher as any).getDefaultClusters()

    console.log("Clusters Padrão (Estratégia de Diversificação):")
    defaultClusters.forEach((match: any, i: number) => {
        const cluster = match.cluster
        console.log(
            `${i + 1}. ${match.clusterName} - ` +
                `Tamanho: ${cluster.size}, ` +
                `Densidade: ${cluster.density?.toFixed(2) || "N/A"}`
        )
    })
    console.log()
}

// Executar as demonstrações
function runDemo() {
    demoBasicClusterMatcher()
    demoCompareRecommendationMethods()
    demoDiversificationStrategy()
}

// Executar a demonstração
runDemo()
