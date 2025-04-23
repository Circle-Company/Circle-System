/**
 * Sistema de Recomendação Executável
 *
 * Este script executa o sistema de recomendação completo do SwipeEngine v2,
 * incluindo a geração de clusters e recomendações de feed.
 */

import * as fs from "fs"
import * as path from "path"
import { ClusterMatcher } from "./core/recommendation/ClusterMatcher"
import { RecommendationEngine } from "./core/recommendation/RecommendationEngine"
import {
    ClusterInfo,
    MatchResult,
    Recommendation,
    RecommendationOptions,
    UserProfile,
} from "./core/types"
import { cosineSimilarity } from "./core/utils/vectorUtils"
import { FeedGenerator } from "./services/real-time/FeedGenerator"

// Configuração do sistema de recomendação
const CONFIG = {
    // Diretório de dados
    dataDir: path.join(__dirname, "data"),

    // Arquivos de dados
    userEmbeddingsFile: "user-embeddings.json",
    postEmbeddingsFile: "post-embeddings.json",
    userClustersFile: "user-clusters.json",
    postClustersFile: "post-clusters.json",

    // Configuração do FeedGenerator
    feedConfig: {
        defaultFeedSize: 10,
        cacheTTL: 300000, // 5 minutos
        maxCacheSize: 1000,
    },

    // Número de usuários de exemplo para testar
    numSampleUsers: 5,

    // Tamanho do feed de recomendação
    feedSize: 5,
}

/**
 * Classe principal para execução do sistema de recomendação
 */
export class RecommendationSystem {
    private userClusters: ClusterInfo[] = []
    private postClusters: ClusterInfo[] = []
    private users: any[] = []
    private posts: any[] = []
    private feedGenerator: FeedGenerator | null = null
    private recommendationEngine: CustomRecommendationEngine | null = null

    constructor() {
        // Verificar e criar diretório de dados se não existir
        if (!fs.existsSync(CONFIG.dataDir)) {
            fs.mkdirSync(CONFIG.dataDir, { recursive: true })
        }
    }

    /**
     * Carrega os dados necessários para o sistema de recomendação
     */
    public async loadData(): Promise<boolean> {
        try {
            console.log("📂 Carregando dados do sistema de recomendação...")

            const userClustersPath = path.join(CONFIG.dataDir, CONFIG.userClustersFile)
            const postClustersPath = path.join(CONFIG.dataDir, CONFIG.postClustersFile)
            const userEmbeddingsPath = path.join(CONFIG.dataDir, CONFIG.userEmbeddingsFile)
            const postEmbeddingsPath = path.join(CONFIG.dataDir, CONFIG.postEmbeddingsFile)

            // Verificar se os arquivos existem
            if (
                !fs.existsSync(userClustersPath) ||
                !fs.existsSync(postClustersPath) ||
                !fs.existsSync(userEmbeddingsPath) ||
                !fs.existsSync(postEmbeddingsPath)
            ) {
                console.log(
                    "❌ Arquivos de dados não encontrados. Execute o SimClusterTestRunner primeiro."
                )
                return false
            }

            // Carregar dados dos arquivos
            this.userClusters = JSON.parse(fs.readFileSync(userClustersPath, "utf8"))
            this.postClusters = JSON.parse(fs.readFileSync(postClustersPath, "utf8"))
            this.users = JSON.parse(fs.readFileSync(userEmbeddingsPath, "utf8"))
            this.posts = JSON.parse(fs.readFileSync(postEmbeddingsPath, "utf8"))

            console.log(`✅ Dados carregados com sucesso:`)
            console.log(`   - ${this.userClusters.length} clusters de usuários`)
            console.log(`   - ${this.postClusters.length} clusters de posts`)
            console.log(`   - ${this.users.length} usuários`)
            console.log(`   - ${this.posts.length} posts`)

            return true
        } catch (error) {
            console.error("❌ Erro ao carregar dados:", error)
            return false
        }
    }

    /**
     * Inicializa o motor de recomendação e o gerador de feed
     */
    public initializeEngine(): void {
        // Criar motor de recomendação personalizado
        this.recommendationEngine = new CustomRecommendationEngine(
            this.userClusters,
            this.postClusters,
            this.users,
            this.posts
        )

        // Criar FeedGenerator
        this.feedGenerator = new FeedGenerator({
            recommendationEngine: this.recommendationEngine,
            defaultFeedSize: CONFIG.feedConfig.defaultFeedSize,
            cacheTTL: CONFIG.feedConfig.cacheTTL,
            maxCacheSize: CONFIG.feedConfig.maxCacheSize,
        })

        console.log("🔄 Motor de recomendação inicializado")
    }

    /**
     * Executa o sistema de recomendação e gera feeds para usuários de exemplo
     */
    public async runRecommendations(): Promise<void> {
        if (!this.feedGenerator || !this.recommendationEngine) {
            console.error(
                "❌ Motor de recomendação não inicializado. Execute initializeEngine() primeiro."
            )
            return
        }

        console.log("\n🚀 Executando sistema de recomendação em tempo real...\n")

        // Selecionar usuários aleatórios para demonstração
        const sampleSize = Math.min(CONFIG.numSampleUsers, this.users.length)
        const userSample = this.users
            .sort(() => 0.5 - Math.random()) // Embaralhar array
            .slice(0, sampleSize)

        // Gerar recomendações para cada usuário da amostra
        for (const user of userSample) {
            await this.generateUserFeed(user)
        }

        // Exibir estatísticas do feed generator
        console.log("\n📊 Estatísticas do sistema de recomendação:")
        if (this.feedGenerator) {
            console.log(this.feedGenerator.getStats())
        }
    }

    /**
     * Gera um feed de recomendações para um usuário específico
     */
    private async generateUserFeed(user: any): Promise<void> {
        if (!this.feedGenerator) return

        console.log(`\n👤 Usuário: ${user.id}`)
        console.log(`   Interesses: ${user.interests.join(", ")}`)
        console.log(`   Localização: ${user.location}`)

        // Contexto baseado no usuário e hora atual
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

        // Gerar feed de recomendações
        console.log(`\n📱 Feed para ${user.id}:`)
        const recommendations = await this.feedGenerator.generateFeed(
            user.id,
            CONFIG.feedSize,
            options
        )

        // Exibir recomendações
        if (recommendations.length === 0) {
            console.log("   Nenhuma recomendação disponível")
        } else {
            // Exibir recomendações com detalhes
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
    }

    /**
     * Executa o sistema de recomendação completo
     */
    public async run(): Promise<void> {
        console.log("\n🌟 Iniciando Sistema de Recomendação SwipeEngine v2\n")

        // Carregar dados
        const dataLoaded = await this.loadData()
        if (!dataLoaded) {
            console.log("❌ Falha ao carregar dados. O sistema de recomendação não será executado.")
            return
        }

        // Inicializar motor
        this.initializeEngine()

        // Executar recomendações
        await this.runRecommendations()

        console.log("\n✅ Execução do sistema de recomendação concluída!")
    }
}

/**
 * Motor de recomendação personalizado para usar com os dados gerados
 */
class CustomRecommendationEngine extends RecommendationEngine {
    private userClusters: ClusterInfo[]
    private postClusters: ClusterInfo[]
    private users: any[]
    private posts: any[]

    constructor(
        userClusters: ClusterInfo[],
        postClusters: ClusterInfo[],
        users: any[],
        posts: any[]
    ) {
        super({
            clusters: userClusters,
        })

        this.userClusters = userClusters
        this.postClusters = postClusters
        this.users = users
        this.posts = posts
    }

    /**
     * Implementa a geração de recomendações personalizadas
     */
    public async getRecommendations(
        userId: string | bigint,
        limit: number = 10,
        options: RecommendationOptions = {}
    ): Promise<Recommendation[]> {
        // Encontrar o usuário correspondente nos dados de teste
        const user = this.users.find((u: any) => u.id === userId)

        if (!user) {
            return []
        }

        // Criar perfil e embedding de usuário
        const userProfile: UserProfile = {
            userId: String(userId),
            interests: user.interests,
            demographics: {
                location: user.location,
                language: user.language,
            },
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
        const clusterMatcher = new ClusterMatcher(this.userClusters, {
            minMatchThreshold: 0.2,
            contextWeight: 0.3,
            interestWeight: 0.3,
            embeddingWeight: 0.4,
        })

        // Encontrar clusters relevantes para o usuário
        const matchingClusters = clusterMatcher.findRelevantClusters(
            userEmbedding,
            userProfile,
            options.context
        )

        // Gerar recomendações baseadas nos clusters relevantes
        const recommendations = this.generateRecommendationsFromClusters(
            matchingClusters,
            user,
            limit
        )

        return recommendations
    }

    /**
     * Gera recomendações a partir de clusters relevantes
     */
    private generateRecommendationsFromClusters(
        relevantClusters: MatchResult[],
        user: any,
        limit: number
    ): Recommendation[] {
        const recommendations: Recommendation[] = []
        const seenPostIds = new Set<string>()

        // Para cada cluster relevante, encontrar posts compatíveis
        for (const match of relevantClusters) {
            const cluster = match.cluster

            // Pular clusters sem tópicos
            if (!cluster.topics || cluster.topics.length === 0) continue

            // Encontrar posts que compartilham tópicos com o cluster
            const matchingPosts = this.posts
                .filter((post: any) => {
                    // Excluir posts já vistos
                    if (seenPostIds.has(post.id)) return false

                    // Verificar overlap de tópicos (já verificamos que cluster.topics existe acima)
                    return post.topics.some((topic: string) => cluster.topics!.includes(topic))
                })
                // Calcular score personalizado para cada post
                .map((post: any) => {
                    // Calcular similaridade entre o usuário e o post usando embedding
                    const embedSimilarity = cosineSimilarity(user.embedding, post.embedding)

                    // Calcular pontuação baseada em múltiplos fatores
                    const score =
                        embedSimilarity * 0.4 + // Similaridade de embedding
                        match.similarity * 0.4 + // Similaridade do cluster
                        (post.engagement / 100) * 0.2 // Engajamento normalizado

                    return {
                        post,
                        score,
                        clusterId: cluster.id,
                        clusterName: cluster.name,
                        topic:
                            post.topics.find((t: string) => cluster.topics!.includes(t)) ||
                            cluster.topics[0],
                    }
                })
                // Ordenar por pontuação
                .sort((a, b) => b.score - a.score)
                // Limitar para distribuir entre clusters
                .slice(0, Math.ceil(limit / relevantClusters.length))

            // Adicionar posts à lista de recomendações
            for (const item of matchingPosts) {
                if (recommendations.length >= limit) break
                if (seenPostIds.has(item.post.id)) continue

                // Adicionar recomendação com metadados
                recommendations.push({
                    entityId: item.post.id,
                    entityType: "post",
                    score: item.score,
                    timestamp: new Date(),
                    source: "simcluster",
                    reasons: [
                        {
                            type: "topic-match",
                            strength: match.similarity,
                            explanation: `Baseado em seu interesse em: ${item.topic}`,
                        },
                    ],
                    metadata: {
                        clusterId: item.clusterId,
                        clusterName: item.clusterName,
                        authorId: item.post.authorId,
                        engagement: item.post.engagement,
                    },
                })

                seenPostIds.add(item.post.id)
            }
        }

        // Se ainda não temos recomendações suficientes, adicionar posts populares
        if (recommendations.length < limit) {
            // Encontrar posts populares que ainda não foram recomendados
            const popularPosts = this.posts
                .filter((post: any) => !seenPostIds.has(post.id))
                .sort((a: any, b: any) => b.engagement - a.engagement)
                .slice(0, limit - recommendations.length)

            // Adicionar à lista de recomendações
            for (const post of popularPosts) {
                recommendations.push({
                    entityId: post.id,
                    entityType: "post",
                    score: 0.3 + (post.engagement / 100) * 0.2, // Score básico + bônus de engajamento
                    timestamp: new Date(),
                    source: "popular",
                    reasons: [
                        {
                            type: "popular",
                            strength: 0.3,
                            explanation: "Post popular na plataforma",
                        },
                    ],
                    metadata: {
                        authorId: post.authorId,
                        engagement: post.engagement,
                    },
                })

                seenPostIds.add(post.id)
            }
        }

        // Ordenar recomendações finais por pontuação
        return recommendations.sort((a, b) => b.score - a.score)
    }
}

/**
 * Função para executar o sistema de recomendação
 */
export async function runRecommendationSystem(): Promise<void> {
    try {
        const system = new RecommendationSystem()
        await system.run()
    } catch (error) {
        console.error("❌ Erro ao executar sistema de recomendação:", error)
    }
}

// Se este arquivo for executado diretamente (não importado)
if (require.main === module) {
    runRecommendationSystem()
}
