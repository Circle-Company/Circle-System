/**
 * SimCluster Test Runner
 *
 * Script executável para testar o funcionamento do SwipeEngine v2
 * com dados simulados de embeddings de usuários e posts.
 *
 * Este script:
 * 1. Gera embeddings de usuários e posts simulados
 * 2. Constrói SimClusters a partir desses dados
 * 3. Salva os clusters gerados em arquivo JSON para reuso
 * 4. Demonstra o algoritmo de recomendação em funcionamento
 */

import * as fs from "fs"
import * as path from "path"
import { DBSCANClustering, performClustering } from "../core/clustering"
import { createClusterMatcher } from "../core/recommendation"
import {
    ClusterInfo,
    Entity,
    MatchResult,
    RecommendationContext,
    UserEmbedding,
    UserProfile,
} from "../core/types"
import { createRandomVector } from "../core/utils/vectorUtils"

// Configurações para simulação
const CONFIG = {
    // Dimensões dos embeddings
    embeddingDimension: 64,

    // Quantidade de dados
    totalUsers: 500,
    totalPosts: 1000,

    // Configurações de clustering
    dbscan: {
        epsilon: 0.3,
        minPoints: 5,
        distanceFunction: "cosine" as "cosine",
    },

    // Caminhos de arquivos
    outputDir: path.join(__dirname, "../data"),
    userEmbeddingsFile: "user-embeddings.json",
    postEmbeddingsFile: "post-embeddings.json",
    userClustersFile: "user-clusters.json",
    postClustersFile: "post-clusters.json",

    // Configurações de interesse (categorias/tópicos simulados)
    categories: [
        "tecnologia",
        "esportes",
        "música",
        "cinema",
        "viagens",
        "culinária",
        "moda",
        "literatura",
        "ciência",
        "política",
        "arte",
        "saúde",
        "jogos",
        "negócios",
        "educação",
    ],

    // Localizações simuladas
    locations: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasília", "Salvador"],

    // Idiomas simulados
    languages: ["pt-BR", "en-US", "es-ES"],
}

// Tipos para armazenamento
interface SimulatedUser {
    id: string
    embedding: number[]
    interests: string[]
    location: string
    language: string
    profile: UserProfile
}

interface SimulatedPost {
    id: string
    embedding: number[]
    authorId: string
    topics: string[]
    engagement: number
}

// Classe principal para execução de testes
export class SimClusterTestRunner {
    private users: SimulatedUser[] = []
    private posts: SimulatedPost[] = []
    private userClusters: ClusterInfo[] = []
    private postClusters: ClusterInfo[] = []
    private dbscan: DBSCANClustering

    constructor() {
        this.dbscan = new DBSCANClustering()
        this.setupOutputDirectory()
    }

    // Configura diretório de saída para arquivos
    private setupOutputDirectory(): void {
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true })
            console.log(`Diretório de saída criado: ${CONFIG.outputDir}`)
        }
    }

    // Gera usuários simulados com embeddings e perfis
    public generateUsers(): void {
        console.log(`Gerando ${CONFIG.totalUsers} usuários simulados...`)

        // Criar centro de embeddings para cada categoria de interesse
        const categoryCenters = new Map<string, number[]>()
        for (const category of CONFIG.categories) {
            // Cada categoria tem um vetor central com um pequeno deslocamento aleatório
            categoryCenters.set(
                category,
                createRandomVector(CONFIG.embeddingDimension, category.charCodeAt(0))
            )
        }

        // Gerar usuários
        for (let i = 0; i < CONFIG.totalUsers; i++) {
            // Escolher interesses aleatórios (1-4 interesses por usuário)
            const numInterests = Math.floor(Math.random() * 4) + 1
            const interests: string[] = []

            while (interests.length < numInterests) {
                const randomIndex = Math.floor(Math.random() * CONFIG.categories.length)
                const interest = CONFIG.categories[randomIndex]
                if (!interests.includes(interest)) {
                    interests.push(interest)
                }
            }

            // Combinar embeddings baseados nos interesses com peso
            let embedding = new Array(CONFIG.embeddingDimension).fill(0)

            // Adicionar os vetores centrais dos interesses
            for (const interest of interests) {
                const interestEmbedding = categoryCenters.get(interest) || []
                // Adicionar o vetor do interesse com um pequeno ruído
                embedding = embedding.map((val, idx) => {
                    return val + interestEmbedding[idx] + (Math.random() * 0.1 - 0.05)
                })
            }

            // Normalizar o embedding final
            const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
            embedding = embedding.map((val) => val / magnitude)

            // Selecionar localização e idioma aleatórios
            const location = CONFIG.locations[Math.floor(Math.random() * CONFIG.locations.length)]
            const language = CONFIG.languages[Math.floor(Math.random() * CONFIG.languages.length)]

            // Criar perfil de usuário
            const profile: UserProfile = {
                userId: `user_${i}`,
                interests: interests,
                demographics: {
                    location: location,
                    language: language,
                    ageRange:
                        Math.random() > 0.7 ? "18-24" : Math.random() > 0.5 ? "25-34" : "35-44",
                },
            }

            // Adicionar usuário à lista
            this.users.push({
                id: `user_${i}`,
                embedding: embedding,
                interests: interests,
                location: location,
                language: language,
                profile: profile,
            })
        }

        console.log(`Gerados ${this.users.length} usuários com embeddings e perfis`)
    }

    // Gera posts simulados com embeddings
    public generatePosts(): void {
        console.log(`Gerando ${CONFIG.totalPosts} posts simulados...`)

        for (let i = 0; i < CONFIG.totalPosts; i++) {
            // Selecionar autor aleatório
            const authorIndex = Math.floor(Math.random() * this.users.length)
            const authorId = this.users[authorIndex].id
            const authorInterests = this.users[authorIndex].interests

            // Selecionar tópicos - tendendo a usar os interesses do autor
            const topics: string[] = []
            const numTopics = Math.floor(Math.random() * 3) + 1

            // 70% de chance de usar os interesses do autor como tópicos
            if (Math.random() < 0.7 && authorInterests.length > 0) {
                // Escolher aleatoriamente entre os interesses do autor
                while (topics.length < numTopics && topics.length < authorInterests.length) {
                    const randomIndex = Math.floor(Math.random() * authorInterests.length)
                    if (!topics.includes(authorInterests[randomIndex])) {
                        topics.push(authorInterests[randomIndex])
                    }
                }
            }

            // Completar com tópicos aleatórios se necessário
            while (topics.length < numTopics) {
                const randomIndex = Math.floor(Math.random() * CONFIG.categories.length)
                const topic = CONFIG.categories[randomIndex]
                if (!topics.includes(topic)) {
                    topics.push(topic)
                }
            }

            // Criar embedding baseado nos tópicos e com alguma proximidade ao autor
            let embedding = new Array(CONFIG.embeddingDimension).fill(0)

            // Combinar com o embedding do autor (com peso de 30%)
            const authorEmbedding = this.users[authorIndex].embedding
            embedding = embedding.map((val, idx) => val + 0.3 * authorEmbedding[idx])

            // Perturbar um pouco para tornar único
            embedding = embedding.map((val) => val + (Math.random() * 0.2 - 0.1))

            // Normalizar o embedding final
            const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
            embedding = embedding.map((val) => val / magnitude)

            // Simular nível de engajamento (0-100)
            const engagement = Math.floor(Math.random() * 100)

            // Adicionar post à lista
            this.posts.push({
                id: `post_${i}`,
                embedding: embedding,
                authorId: authorId,
                topics: topics,
                engagement: engagement,
            })
        }

        console.log(`Gerados ${this.posts.length} posts com embeddings`)
    }

    // Salva dados gerados em arquivos JSON
    public saveGeneratedData(): void {
        // Salvar embeddings de usuários
        const userEmbeddingsPath = path.join(CONFIG.outputDir, CONFIG.userEmbeddingsFile)
        fs.writeFileSync(userEmbeddingsPath, JSON.stringify(this.users, null, 2))
        console.log(`Embeddings de usuários salvos em: ${userEmbeddingsPath}`)

        // Salvar embeddings de posts
        const postEmbeddingsPath = path.join(CONFIG.outputDir, CONFIG.postEmbeddingsFile)
        fs.writeFileSync(postEmbeddingsPath, JSON.stringify(this.posts, null, 2))
        console.log(`Embeddings de posts salvos em: ${postEmbeddingsPath}`)
    }

    // Carrega dados previamente gerados
    public loadGeneratedData(): boolean {
        try {
            const userEmbeddingsPath = path.join(CONFIG.outputDir, CONFIG.userEmbeddingsFile)
            const postEmbeddingsPath = path.join(CONFIG.outputDir, CONFIG.postEmbeddingsFile)

            if (fs.existsSync(userEmbeddingsPath) && fs.existsSync(postEmbeddingsPath)) {
                this.users = JSON.parse(fs.readFileSync(userEmbeddingsPath, "utf8"))
                this.posts = JSON.parse(fs.readFileSync(postEmbeddingsPath, "utf8"))

                console.log(`Carregados ${this.users.length} usuários e ${this.posts.length} posts`)
                return true
            }
            return false
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
            return false
        }
    }

    // Constrói clusters usando o algoritmo DBSCAN
    public async buildClusters(): Promise<void> {
        // Verificar se já existem clusters salvos
        const userClustersPath = path.join(CONFIG.outputDir, CONFIG.userClustersFile)
        const postClustersPath = path.join(CONFIG.outputDir, CONFIG.postClustersFile)

        if (fs.existsSync(userClustersPath) && fs.existsSync(postClustersPath)) {
            console.log("Carregando clusters existentes...")
            this.userClusters = JSON.parse(fs.readFileSync(userClustersPath, "utf8"))
            this.postClusters = JSON.parse(fs.readFileSync(postClustersPath, "utf8"))

            console.log(
                `Carregados ${this.userClusters.length} clusters de usuários e ${this.postClusters.length} clusters de posts`
            )
            return
        }

        console.log("Iniciando clustering...")

        // Extrair embeddings e criar entidades para clustering
        const userEmbeddings = this.users.map((user) => user.embedding)
        const userEntities: Entity[] = this.users.map((user) => ({
            id: user.id,
            type: "user",
            metadata: {
                interests: user.interests,
                location: user.location,
                language: user.language,
            },
        }))

        // Clusters de usuários
        console.log("Criando clusters de usuários...")
        const userClusteringResult = await performClustering(
            userEmbeddings,
            userEntities,
            CONFIG.dbscan
        )

        this.userClusters = userClusteringResult.clusters.map((cluster, index) => {
            // Extrair tópicos predominantes deste cluster
            const allInterests: string[] = []
            const members = (cluster as any).members || []

            for (const member of members) {
                const userId = member.id.toString()
                const user = this.users.find((u) => u.id === userId)
                if (user) {
                    allInterests.push(...user.interests)
                }
            }

            // Contar frequência de cada tópico
            const interestCounts = new Map<string, number>()
            for (const interest of allInterests) {
                interestCounts.set(interest, (interestCounts.get(interest) || 0) + 1)
            }

            // Selecionar os 5 tópicos mais frequentes
            const topTopics = Array.from(interestCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map((entry) => entry[0])

            // Determinar localizações predominantes
            const locationCounts = new Map<string, number>()
            for (const member of members) {
                const userId = member.id.toString()
                const user = this.users.find((u) => u.id === userId)
                if (user) {
                    locationCounts.set(user.location, (locationCounts.get(user.location) || 0) + 1)
                }
            }

            const preferredLocations = Array.from(locationCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map((entry) => entry[0])

            // Determinar idiomas predominantes
            const languageCounts = new Map<string, number>()
            for (const member of members) {
                const userId = member.id.toString()
                const user = this.users.find((u) => u.id === userId)
                if (user) {
                    languageCounts.set(user.language, (languageCounts.get(user.language) || 0) + 1)
                }
            }

            const languages = Array.from(languageCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map((entry) => entry[0])

            return {
                id: `cluster_user_${index}`,
                name: `Cluster ${index}: ${topTopics.join(", ")}`,
                centroid: cluster.centroid,
                topics: topTopics,
                memberIds: members.map((m) => m.id.toString()),
                preferredLocations,
                languages,
                size: members.length,
                density: (cluster as any).metrics?.cohesion || 0,
                metadata: {
                    interestCounts: Array.from(interestCounts.entries()),
                    locationCounts: Array.from(locationCounts.entries()),
                    languageCounts: Array.from(languageCounts.entries()),
                },
            } as ClusterInfo
        })

        console.log(`Criados ${this.userClusters.length} clusters de usuários`)

        // Extrair embeddings e criar entidades para clustering de posts
        const postEmbeddings = this.posts.map((post) => post.embedding)
        const postEntities: Entity[] = this.posts.map((post) => ({
            id: post.id,
            type: "post",
            metadata: {
                authorId: post.authorId,
                topics: post.topics,
                engagement: post.engagement,
            },
        }))

        // Clusters de posts
        console.log("Criando clusters de posts...")
        const postClusteringResult = await performClustering(
            postEmbeddings,
            postEntities,
            CONFIG.dbscan
        )

        this.postClusters = postClusteringResult.clusters.map((cluster, index) => {
            // Extrair tópicos predominantes deste cluster
            const allTopics: string[] = []
            const members = (cluster as any).members || []

            for (const member of members) {
                const postId = member.id.toString()
                const post = this.posts.find((p) => p.id === postId)
                if (post) {
                    allTopics.push(...post.topics)
                }
            }

            // Contar frequência de cada tópico
            const topicCounts = new Map<string, number>()
            for (const topic of allTopics) {
                topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
            }

            // Selecionar os 5 tópicos mais frequentes
            const topTopics = Array.from(topicCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map((entry) => entry[0])

            return {
                id: `cluster_post_${index}`,
                name: `Tópico ${index}: ${topTopics.join(", ")}`,
                centroid: cluster.centroid,
                topics: topTopics,
                memberIds: members.map((m) => m.id.toString()),
                size: members.length,
                density: (cluster as any).metrics?.cohesion || 0,
                metadata: {
                    topicCounts: Array.from(topicCounts.entries()),
                    avgEngagement:
                        members.reduce((sum, member) => {
                            const postId = member.id.toString()
                            const post = this.posts.find((p) => p.id === postId)
                            return sum + (post ? post.engagement : 0)
                        }, 0) / Math.max(1, members.length),
                },
            } as ClusterInfo
        })

        console.log(`Criados ${this.postClusters.length} clusters de posts`)

        // Salvar clusters gerados
        fs.writeFileSync(userClustersPath, JSON.stringify(this.userClusters, null, 2))
        console.log(`Clusters de usuários salvos em: ${userClustersPath}`)

        fs.writeFileSync(postClustersPath, JSON.stringify(this.postClusters, null, 2))
        console.log(`Clusters de posts salvos em: ${postClustersPath}`)
    }

    // Demonstra o funcionamento do algoritmo de recomendação
    public runRecommendationDemo(): void {
        console.log("\n===== DEMONSTRAÇÃO DO ALGORITMO DE RECOMENDAÇÃO =====\n")

        // 1. Selecionar um usuário aleatório para receber recomendações
        const randomUserIndex = Math.floor(Math.random() * this.users.length)
        const user = this.users[randomUserIndex]

        console.log(`Usuário selecionado: ${user.id}`)
        console.log(`Interesses: ${user.interests.join(", ")}`)
        console.log(`Localização: ${user.location}`)
        console.log(`Idioma: ${user.language}\n`)

        // 2. Criar embedding de usuário
        const userEmbedding: UserEmbedding = {
            userId: user.id,
            vector: {
                dimension: CONFIG.embeddingDimension,
                values: user.embedding,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            metadata: {
                interests: user.interests,
            },
        }

        // 3. Criar um contexto de recomendação
        const context: RecommendationContext = {
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            location: user.location,
            language: user.language,
            device: Math.random() > 0.7 ? "mobile" : "desktop",
        }

        // 4. Criar o ClusterMatcher
        const clusterMatcher = createClusterMatcher(this.userClusters, {
            maxClusters: 5,
            minMatchThreshold: 0.2,
            embeddingWeight: 0.5,
            interestWeight: 0.3,
            contextWeight: 0.2,
        })

        // 5. Obter clusters relevantes
        console.log("Buscando clusters relevantes para o usuário...")
        const relevantClusters = clusterMatcher.findRelevantClusters(
            userEmbedding,
            user.profile,
            context
        )

        // 6. Exibir resultados
        console.log(`\nEncontrados ${relevantClusters.length} clusters relevantes:\n`)

        relevantClusters.forEach((match, index) => {
            console.log(`Cluster #${index + 1}: ${match.clusterName}`)
            console.log(`ID: ${match.clusterId}`)
            console.log(`Similaridade: ${match.similarity.toFixed(4)}`)
            console.log(`Tamanho: ${match.cluster.size} membros`)
            console.log(`Tópicos: ${match.cluster.topics?.join(", ") || "N/A"}`)
            console.log()
        })

        // 7. Simular seleção de conteúdo a partir dos clusters
        console.log("Simulando seleção de conteúdo recomendado...")
        const recommendedPosts = this.simulateContentRecommendation(relevantClusters, 10)

        console.log("\nConteúdo recomendado:")
        recommendedPosts.forEach((post, index) => {
            console.log(`${index + 1}. Post ${post.id}`)
            console.log(`   Tópicos: ${post.topics.join(", ")}`)
            console.log(`   Autor: ${post.authorId}`)
            console.log(`   Engajamento: ${post.engagement}`)
            console.log()
        })
    }

    // Simula seleção de conteúdo a partir dos clusters relevantes
    private simulateContentRecommendation(
        relevantClusters: MatchResult[],
        limit: number
    ): SimulatedPost[] {
        const recommendedPosts: SimulatedPost[] = []
        const seenPostIds = new Set<string>()

        // Distribuir o limite de recomendações entre os clusters
        // proporcionalmente à sua similaridade
        const totalSimilarity = relevantClusters.reduce(
            (sum, cluster) => sum + cluster.similarity,
            0
        )
        const clusterPostCounts = relevantClusters.map((cluster) => {
            return Math.ceil((cluster.similarity / totalSimilarity) * limit)
        })

        // Para cada cluster, selecionar posts cujos tópicos se alinham com os tópicos do cluster
        for (let i = 0; i < relevantClusters.length; i++) {
            const cluster = relevantClusters[i].cluster
            const postsNeeded = clusterPostCounts[i]

            if (!cluster.topics || cluster.topics.length === 0) continue

            // Encontrar posts que têm pelo menos um tópico em comum com o cluster
            const matchingPosts = this.posts.filter((post) => {
                // Verificar se já foi recomendado
                if (seenPostIds.has(post.id)) return false

                // Verificar se há overlap de tópicos
                return post.topics.some((topic) => cluster.topics?.includes(topic))
            })

            // Ordenar por engajamento (como proxy de qualidade)
            matchingPosts.sort((a, b) => b.engagement - a.engagement)

            // Selecionar os melhores posts até o limite
            const selectedPosts = matchingPosts.slice(0, postsNeeded)

            // Adicionar à lista de recomendações
            for (const post of selectedPosts) {
                if (!seenPostIds.has(post.id)) {
                    recommendedPosts.push(post)
                    seenPostIds.add(post.id)

                    // Parar se atingimos o limite total
                    if (recommendedPosts.length >= limit) break
                }
            }

            // Parar se atingimos o limite total
            if (recommendedPosts.length >= limit) break
        }

        // Se ainda não temos posts suficientes, adicionar os mais populares que ainda não foram recomendados
        if (recommendedPosts.length < limit) {
            const remainingPosts = this.posts
                .filter((post) => !seenPostIds.has(post.id))
                .sort((a, b) => b.engagement - a.engagement)
                .slice(0, limit - recommendedPosts.length)

            recommendedPosts.push(...remainingPosts)
        }

        return recommendedPosts
    }

    // Executa toda a pipeline de demonstração
    public async runFullDemo(): Promise<void> {
        console.log("Iniciando demonstração completa do SimCluster...\n")

        // Tentar carregar dados existentes ou gerar novos
        if (!this.loadGeneratedData()) {
            console.log("Dados não encontrados. Gerando novos dados...")
            this.generateUsers()
            this.generatePosts()
            this.saveGeneratedData()
        }

        // Construir clusters
        await this.buildClusters()

        // Executar demonstração de recomendação
        this.runRecommendationDemo()

        console.log("\nDemonstração concluída!")
    }
}

// Função principal
async function main() {
    const runner = new SimClusterTestRunner()
    await runner.runFullDemo()
}

// Executar o script
main().catch((error) => {
    console.error("Erro durante a execução:", error)
    process.exit(1)
})
