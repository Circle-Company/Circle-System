import * as fs from "fs"
import * as path from "path"
import { RecommendationEngine } from "./core/recommendation/RecommendationEngine"
import { RecommendationOptions, UserProfile } from "./core/types"
import { SimClusterTestRunner } from "./examples/simcluster-test-runner"
import { FeedGenerator } from "./services/real-time/FeedGenerator"

/**
 * Função para executar os testes de cluster na inicialização do servidor
 */
export async function runClusterTests() {
    console.log("🧪 Iniciando testes de SimClusters...")

    try {
        // Criar uma instância do runner de testes
        const runner = new SimClusterTestRunner()

        // Executar a demonstração completa
        await runner.runFullDemo()

        // Após a execução bem-sucedida, executar o demonstrativo de FeedGenerator
        await runFeedGeneratorDemo()

        console.log("✅ Testes de SimClusters concluídos com sucesso!")
    } catch (error) {
        console.error("❌ Erro durante os testes de SimClusters:", error)
    }
}

/**
 * Demonstração do FeedGenerator usando os clusters gerados
 */
async function runFeedGeneratorDemo() {
    console.log("\n🔄 Iniciando demonstração do FeedGenerator...")

    try {
        // Carregar clusters gerados pelo SimClusterTestRunner
        const dataDir = path.join(__dirname, "data")
        const userClustersPath = path.join(dataDir, "user-clusters.json")
        const postClustersPath = path.join(dataDir, "post-clusters.json")
        const userEmbeddingsPath = path.join(dataDir, "user-embeddings.json")

        // Verificar se os arquivos existem
        if (!fs.existsSync(userClustersPath) || !fs.existsSync(postClustersPath)) {
            throw new Error(
                "Arquivos de clusters não encontrados. Execute o SimClusterTestRunner primeiro."
            )
        }

        const userClusters = JSON.parse(fs.readFileSync(userClustersPath, "utf8"))
        const postClusters = JSON.parse(fs.readFileSync(postClustersPath, "utf8"))
        const users = JSON.parse(fs.readFileSync(userEmbeddingsPath, "utf8"))

        console.log(
            `📊 Carregados ${userClusters.length} clusters de usuários e ${postClusters.length} clusters de posts`
        )

        // Criar motor de recomendação personalizado
        const customEngine = new CustomRecommendationEngine(userClusters, postClusters)

        // Criar FeedGenerator
        const feedGenerator = new FeedGenerator({
            recommendationEngine: customEngine,
            defaultFeedSize: 10,
            cacheTTL: 300000, // 5 minutos
            maxCacheSize: 1000,
        })

        // Gerar feeds para alguns usuários de exemplo
        console.log("\n🎯 Gerando feeds de recomendação para usuários de exemplo:")

        // Escolher 3 usuários aleatórios para demonstração
        const userSampleSize = Math.min(3, users.length)
        const userSample = users
            .sort(() => 0.5 - Math.random()) // Embaralhar array
            .slice(0, userSampleSize)

        for (const user of userSample) {
            console.log(`\n👤 Usuário: ${user.id}`)
            console.log(`   Interesses: ${user.interests.join(", ")}`)
            console.log(`   Localização: ${user.location}`)

            // Contexto baseado no usuário
            const context = {
                timeOfDay: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
                location: user.location,
                language: user.language,
            }

            // Opções de recomendação
            const options: RecommendationOptions = {
                context,
                diversity: 0.7,
                novelty: 0.5,
            }

            // Gerar feed
            console.log(`\n📱 Feed para ${user.id}:`)
            const recommendations = await feedGenerator.generateFeed(user.id, 5, options)

            if (recommendations.length === 0) {
                console.log("   Nenhuma recomendação disponível")
            } else {
                recommendations.forEach((rec, idx) => {
                    console.log(`   ${idx + 1}. Item: ${rec.entityId}`)
                    console.log(`      Tipo: ${rec.entityType}`)
                    console.log(`      Pontuação: ${rec.score.toFixed(2)}`)
                    if (rec.reasons && rec.reasons.length > 0) {
                        console.log(`      Motivo: ${rec.reasons[0].explanation}`)
                    }
                    console.log("")
                })
            }

            // Mostrar estatísticas do cache
            if (user === userSample[userSample.length - 1]) {
                console.log("\n📈 Estatísticas do FeedGenerator:")
                console.log(feedGenerator.getStats())
            }
        }

        console.log("\n✅ Demonstração do FeedGenerator concluída!")
    } catch (error) {
        console.error("❌ Erro durante a demonstração do FeedGenerator:", error)
    }
}

/**
 * Implementação personalizada do RecommendationEngine para usar com os dados gerados
 */
class CustomRecommendationEngine extends RecommendationEngine {
    private userClusters: any[]
    private postClusters: any[]

    constructor(userClusters: any[], postClusters: any[]) {
        super({
            // Passando os clusters para o construtor da classe base
            clusters: userClusters,
        })
        this.userClusters = userClusters
        this.postClusters = postClusters
    }

    /**
     * Implementa a geração de recomendações
     */
    public async getRecommendations(
        userId: string | bigint,
        limit: number = 10,
        options: RecommendationOptions = {}
    ): Promise<any[]> {
        // Encontrar o usuário correspondente nos dados de teste
        const dataDir = path.join(__dirname, "data")
        const userEmbeddingsPath = path.join(dataDir, "user-embeddings.json")
        const postEmbeddingsPath = path.join(dataDir, "post-embeddings.json")

        const allUsers = JSON.parse(fs.readFileSync(userEmbeddingsPath, "utf8"))
        const allPosts = JSON.parse(fs.readFileSync(postEmbeddingsPath, "utf8"))

        const user = allUsers.find((u: any) => u.id === userId)

        if (!user) {
            return []
        }

        // Criar perfil e embedding de usuário
        const userProfile: UserProfile = {
            userId: String(userId),
            interests: user.interests,
        }

        const userEmbedding = {
            userId: String(userId),
            vector: {
                dimension: user.embedding.length,
                values: user.embedding,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        }

        // Usar o ClusterMatcher para encontrar clusters relevantes
        const { ClusterMatcher } = await import("./core/recommendation/ClusterMatcher")
        const clusterMatcher = new ClusterMatcher(this.userClusters)
        const matchingClusters = clusterMatcher.findRelevantClusters(
            userEmbedding,
            userProfile,
            options.context
        )

        // Simular seleção de posts com base nos clusters, similar ao SimClusterTestRunner
        const recommendations: any[] = []
        const seenPostIds = new Set<string>()

        // Selecionar posts cujos tópicos se alinham com os tópicos dos clusters encontrados
        for (const match of matchingClusters) {
            const cluster = match.cluster

            if (!cluster.topics || cluster.topics.length === 0) continue

            // Encontrar posts que têm pelo menos um tópico em comum com o cluster
            const matchingPosts = allPosts
                .filter((post: any) => {
                    // Verificar se já foi recomendado
                    if (seenPostIds.has(post.id)) return false

                    // Verificar se há overlap de tópicos
                    return post.topics.some((topic: string) => cluster.topics?.includes(topic))
                })
                .sort((a: any, b: any) => b.engagement - a.engagement) // Ordenar por engajamento
                .slice(0, Math.ceil(limit / matchingClusters.length)) // Distribuir o limite entre os clusters

            for (const post of matchingPosts) {
                if (recommendations.length >= limit) break
                if (seenPostIds.has(post.id)) continue

                // Adicionar à lista de recomendações
                recommendations.push({
                    entityId: post.id,
                    entityType: "post",
                    score: 0.5 + match.similarity * 0.5, // Pontuação baseada na similaridade do cluster
                    timestamp: new Date(),
                    source: "simcluster",
                    reasons: [
                        {
                            type: "topic-match",
                            strength: match.similarity,
                            explanation: `Baseado em seu interesse em: ${cluster.topics[0]}`,
                        },
                    ],
                })

                seenPostIds.add(post.id)
            }
        }

        // Se ainda não temos posts suficientes, adicionar os mais populares
        if (recommendations.length < limit) {
            const remainingPosts = allPosts
                .filter((post: any) => !seenPostIds.has(post.id))
                .sort((a: any, b: any) => b.engagement - a.engagement)
                .slice(0, limit - recommendations.length)

            for (const post of remainingPosts) {
                recommendations.push({
                    entityId: post.id,
                    entityType: "post",
                    score: 0.3, // Pontuação mais baixa para recomendações não personalizadas
                    timestamp: new Date(),
                    source: "popular",
                    reasons: [
                        {
                            type: "popular",
                            strength: 0.3,
                            explanation: "Post popular na plataforma",
                        },
                    ],
                })

                seenPostIds.add(post.id)
            }
        }

        return recommendations
    }
}
