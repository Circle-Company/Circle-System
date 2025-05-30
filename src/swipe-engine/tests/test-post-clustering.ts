import { ClusterInfo, ClusteringResult, Entity } from "../core/types"

import { DBSCANClustering } from "../core/clustering"
import PostCluster from "../models/PostCluster"
import PostClusterRank from "../models/PostClusterRank"
import PostEmbedding from "../models/PostEmbedding"
import { connection } from "../../database"
import { getLogger } from "../core/utils/logger"
import { mockPosts } from "../data/mock-posts"

const logger = getLogger("test-post-clustering")

// Interface para o tipo do post com suas associações
interface PostWithAssociations {
    id: bigint
    user_id: bigint
    description: string | null
    visible: boolean
    deleted: boolean
    blocked: boolean
    createdAt: Date
    updatedAt: Date
    PostEmbedding?: {
        vector: string
    }
    moment_statistics?: {
        total_views_num: number
        total_likes_num: number
        total_comments_num: number
        total_shares_num: number
    }
    tags?: Array<{
        id: bigint
        title: string
    }>
}

// Interface para garantir que metadata sempre existe
interface EntityWithMetadata extends Entity {
    metadata: {
        tags: string[]
        statistics: {
            views: number
            likes: number
            comments: number
            shares: number
        }
        creatorId: string | bigint
    }
}

/**
 * Insere os posts mock no banco de dados usando Sequelize
 */
async function insertMockPostsInDatabase() {
    try {
        logger.info("Inserindo posts mock no banco de dados...")
        
        // Verificar se já existem embeddings
        const count = await PostEmbedding.count()
        
        if (count > 0) {
            logger.info(`Já existem ${count} embeddings no banco. Pulando inserção de mocks.`)
            return
        }

        // Inserir posts mock
        logger.info(`Inserindo ${mockPosts.length} posts mock no banco...`)
        
        for (const post of mockPosts) {
            try {
                if (post.embedding && post.embedding.vector) {
                    const existing = await PostEmbedding.findOne({
                        where: { postId: String(post.id) }
                    })
                    
                    if (!existing) {
                        await PostEmbedding.create({
                            postId: String(post.id),
                            vector: JSON.stringify(post.embedding.vector.values),
                            dimension: post.embedding.vector.dimension,
                            metadata: {
                                tags: post.tags || [],
                                statistics: post.statistics || { 
                                    views: 0, 
                                    likes: 0, 
                                    comments: 0, 
                                    shares: 0 
                                },
                                created_at: post.created_at,
                                userId: post.user_id
                            }
                        })
                        logger.info(`✅ Embedding inserido para post ${post.id}`)
                    } else {
                        logger.info(`⏩ Embedding já existe para post ${post.id}`)
                    }
                }
            } catch (error) {
                logger.error(`❌ Erro ao inserir post ${post.id}:`, error)
            }
        }

        // Verificar se os dados foram inseridos corretamente
        const totalCount = await PostEmbedding.count()
        logger.info(`Total de embeddings na tabela: ${totalCount}`)
        
        logger.info("✅ Dados mock inseridos com sucesso!")
    } catch (error) {
        logger.error("❌ Erro ao inserir dados mock:", error)
        throw error
    }
}

/**
 * Testa o clustering de posts usando o algoritmo DBSCAN com dados do banco
 */
export async function testPostClustering() {
    try {
        // Verificar conexão com o banco
        await connection.authenticate()
        logger.info("Conexão com o banco de dados estabelecida")

        // Primeiro, inserir os posts mock no banco
        await insertMockPostsInDatabase()

        // Buscar posts com embeddings para clustering
        logger.info("Buscando posts com embeddings para clustering...")
        
        const embeddings = await PostEmbedding.findAll()
        
        if (embeddings.length === 0) {
            throw new Error("Nenhum embedding encontrado no banco de dados")
        }
        
        logger.info(`Encontrados ${embeddings.length} embeddings para clustering`)

        // Preparar dados para clustering
        logger.info("Preparando dados para clustering...")
        
        const entities: EntityWithMetadata[] = []
        const vectors: number[][] = []
        
        for (const embedding of embeddings) {
            try {
                const metadata = embedding.metadata || {}
                const vector = JSON.parse(embedding.vector)
                
                entities.push({
                    id: embedding.postId,
                    type: "post",
                    metadata: {
                        tags: metadata.tags || [],
                        statistics: metadata.statistics || {
                            views: 0,
                            likes: 0,
                            comments: 0,
                            shares: 0
                        },
                        creatorId: metadata.userId
                    }
                })
                
                vectors.push(vector)
            } catch (error) {
                logger.error(`Erro ao processar embedding do post ${embedding.postId}:`, error)
            }
        }

        if (entities.length === 0) {
            throw new Error("Nenhuma entidade válida encontrada para clustering")
        }

        // Configurar algoritmo DBSCAN
        const config = {
            epsilon: 0.3,
            minPoints: 2,
            distanceFunction: "cosine",
            noiseHandling: "separate-cluster",
            maxIterations: 100,
            convergenceThreshold: 0.001
        }

        // Executar clustering
        logger.info("Executando clustering com DBSCAN...")
        const clustering = new DBSCANClustering()
        // Configurar propriedades do clustering antes de chamar cluster
        Object.assign(clustering, { 
            epsilon: config.epsilon,
            minPoints: config.minPoints,
            distanceFunction: config.distanceFunction
        });

        const startTime = Date.now();
        const result = await clustering.cluster(vectors, entities)

        // Exibir resultados
        logger.info("\nResultados do Clustering:")
        logger.info(`Número de clusters: ${result.clusters.length}`)
        logger.info(`Tempo de execução: ${Date.now() - startTime}ms`)
        logger.info(`Convergiu: ${result.clusters.length > 0 ? "sim" : "não"}`)

        // Detalhes de cada cluster
        result.clusters.forEach((cluster, index) => {
            logger.info(`\nCluster ${index + 1}:`)
            logger.info(`- Tamanho: ${cluster.memberIds?.length || 0} posts`)
            logger.info(`- Densidade: ${cluster.density?.toFixed(3) || 0}`)
            
            // Exibir alguns posts do cluster
            const samplePosts = cluster.memberIds?.slice(0, 3) || []
            logger.info("- Posts de exemplo:")
            samplePosts.forEach(postId => {
                const entity = entities.find(e => String(e.id) === String(postId)) as EntityWithMetadata | undefined
                if (entity) {
                    logger.info(`  * Post ID: ${entity.id}`)
                    logger.info(`    Tags: ${entity.metadata.tags.join(", ") || "nenhuma"}`)
                    logger.info(`    Estatísticas: ${JSON.stringify(entity.metadata.statistics)}`)
                }
            })
        })

        // Exibir outliers se houver
        const clusteredPostIds = new Set(
            result.clusters.flatMap(cluster => cluster.memberIds || [])
        )
        const outliers = entities.filter(entity => !clusteredPostIds.has(String(entity.id)))

        if (outliers.length > 0) {
            logger.info(`\nPosts não agrupados (outliers): ${outliers.length}`)
            outliers.slice(0, 3).forEach(entity => {
                logger.info(`- Post ID: ${entity.id}`)
                logger.info(`  Tags: ${entity.metadata.tags.join(", ") || "nenhuma"}`)
            })
        }

        // Salvar resultados no banco
        logger.info("\nSalvando resultados no banco de dados...")
        
        // Limpar clusters anteriores
        await PostCluster.destroy({ where: {} })
        await PostClusterRank.destroy({ where: {} })
        
        // Inserir novos clusters
        for (let i = 0; i < result.clusters.length; i++) {
            const cluster = result.clusters[i]
            if (cluster.memberIds && cluster.memberIds.length > 0) {
                // Criar cluster
                const postCluster = await PostCluster.create({
                    name: `Cluster ${i + 1}`,
                    centroid: JSON.stringify(cluster.centroid),
                    topics: [],
                    memberIds: cluster.memberIds,
                    category: "general",
                    tags: [],
                    size: cluster.memberIds.length,
                    density: cluster.density || 0,
                    avgEngagement: 0,
                    metadata: {}
                })

                // Criar ranks para cada post do cluster
                for (const postId of cluster.memberIds) {
                    await PostClusterRank.create({
                        postId: String(postId),
                        clusterId: postCluster.id.toString(),
                        score: 1.0,
                        similarity: 1.0,
                        relevanceScore: 1.0,
                        engagementScore: 0,
                        isActive: true,
                        lastUpdated: new Date()
                    })
                }
                
                logger.info(`Cluster ${i + 1} salvo com ${cluster.memberIds.length} posts`)
            }
        }
        
        // Inserir outliers como cluster especial
        if (outliers.length > 0) {
            const outlierCluster = await PostCluster.create({
                name: "Outliers",
                centroid: JSON.stringify({ values: [], dimension: 0 }),
                topics: [],
                memberIds: outliers.map(e => String(e.id)),
                category: "outliers",
                tags: [],
                size: outliers.length,
                density: 0,
                avgEngagement: 0,
                metadata: { isOutlierCluster: true }
            })

            for (const entity of outliers) {
                await PostClusterRank.create({
                    postId: String(entity.id),
                    clusterId: outlierCluster.id.toString(),
                    score: 0,
                    similarity: 0,
                    relevanceScore: 0,
                    engagementScore: 0,
                    isActive: true,
                    lastUpdated: new Date()
                })
            }
            
            logger.info(`${outliers.length} outliers salvos em cluster especial`)
        }

        logger.info("\nTeste de clustering concluído com sucesso!")
    } catch (error) {
        logger.error("Erro durante o teste de clustering:", error)
        throw error
    } finally {
        await connection.close()
    }
}

// Executar o teste se a variável de ambiente TEST_CLUSTERING estiver definida
if (process.env.TEST_CLUSTERING === "true") {
    testPostClustering()
        .then(() => {
            logger.info("Teste de clustering concluído com sucesso!")
            process.exit(0)
        })
        .catch((error) => {
            logger.error("Erro fatal durante o teste:", error)
            process.exit(1)
        })
} 