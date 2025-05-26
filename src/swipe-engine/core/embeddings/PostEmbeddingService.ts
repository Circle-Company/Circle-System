/**
 * Serviço de embedding para posts/conteúdos
 */

import { EmbeddingVector, EngagementMetrics, PostEmbeddingProps, PostEmbedding as PostEmbeddingType, UpdatedPostStats } from "../types"
import { combineVectors, resizeVector } from "../utils/vector-operations"

import { Op } from "sequelize"
import { EmbeddingParams as Params } from "../../params"
import PostEmbedding from "../../models/PostEmbedding"
import { getLogger } from "../utils/logger"
import { normalizeL2 } from "../utils/normalization"

// Definição das interfaces para repositórios
export interface IPostRepository {
    findById(postId: bigint): Promise<any>
    findRecentPostIds(limit: number): Promise<bigint[]>
    // outros métodos do repositório
}

export interface IPostEmbeddingRepository {
    findByPostId(postId: bigint): Promise<{
        postId: bigint
        embedding: number[]
        lastUpdated: Date
        version: number
        metadata?: Record<string, any>
    } | null>
    saveOrUpdate(data: {
        postId: bigint
        embedding: number[]
        lastUpdated: Date
        version: number
        metadata?: Record<string, any>
    }): Promise<void>
    // outros métodos do repositório
}

export interface ITagRepository {
    findTagsForPost(postId: bigint): Promise<string[]>
    // outros métodos do repositório
}

/**
 * Serviço para gerar e gerenciar embeddings de posts/conteúdos
 */
export class PostEmbeddingService {
    private readonly logger = getLogger("PostEmbeddingService")
    private model: any = null
    private readonly dimension: number

    // Pesos para diferentes componentes do embedding
    private readonly WEIGHT_TEXT = Params.weights.content.text
    private readonly WEIGHT_TAGS = Params.weights.content.tags
    private readonly WEIGHT_ENGAGEMENT = Params.weights.content.engagement

    constructor(dimension: number = Params.dimensions.embedding) {
        this.dimension = dimension
    }

    protected async loadModel(): Promise<void> {
        if (!this.model) {
            this.logger.info("Carregando modelo de embedding de posts...")
            this.model = {
                embed: (text: string) => {
                    const hash = this.simpleHash(text)
                    const embedding = new Array(this.dimension).fill(0)
                    for (let i = 0; i < this.dimension; i++) {
                        embedding[i] = (Math.sin(hash * (i + 1)) + 1) / 2
                    }
                    return normalizeL2(embedding)
                },
            }
        }
    }

    /**
     * Gera embedding para um post
     * @param postData Dados do post
     * @returns Vetor de embedding
     */
    public async generateEmbedding(postData: PostEmbeddingProps): Promise<number[]> {
        await this.loadModel() // Garante que o modelo está carregado

        // 1. Extrair embedding do texto
        const textEmbedding = await this.extractTextEmbedding(postData.textContent)

        // 2. Extrair embedding das tags
        const tagsEmbedding = await this.extractTagsEmbedding(postData.tags)

        // 3. Extrair embedding baseado no engajamento
        const engagementEmbedding = this.extractEngagementEmbedding(postData.engagementMetrics)

        // 4. Combinar os embeddings com pesos
        const combinedEmbedding = combineVectors(
            [textEmbedding, tagsEmbedding, engagementEmbedding],
            [this.WEIGHT_TEXT, this.WEIGHT_TAGS, this.WEIGHT_ENGAGEMENT]
        )

        // 5. Normalizar o resultado
        return normalizeL2(combinedEmbedding)
    }

    /**
     * Atualiza um embedding existente com novas informações
     * @param currentEmbedding Embedding atual do post
     * @param updates Novas informações para atualização
     * @returns Embedding atualizado
     */
    public async updateEmbedding(
        currentEmbedding: EmbeddingVector,
        newData: Partial<PostEmbeddingProps>
    ): Promise<EmbeddingVector> {
        const completeData: PostEmbeddingProps = {
            textContent: newData.textContent || "",
            tags: newData.tags || [],
            engagementMetrics: newData.engagementMetrics || {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                saves: 0,
                engagementRate: 0
            },
            authorId: newData.authorId ? BigInt(newData.authorId) : BigInt(0),
            createdAt: newData.createdAt || new Date()
        }

        const newEmbedding = await this.build(completeData)

        // Combinar embeddings com peso maior para o embedding atual
        const updatedVector = combineVectors(
            [currentEmbedding.values, newEmbedding.values],
            [0.7, 0.3] // 70% do embedding atual, 30% do novo
        )

        return {
            values: updatedVector,
            dimension: this.dimension,
            metadata: {
                ...currentEmbedding.metadata,
                ...newEmbedding.metadata,
                lastUpdated: new Date().toISOString(),
            },
            createdAt: currentEmbedding.createdAt,
            updatedAt: new Date()
        }
    }

    /**
     * Recupera ou gera o embedding para um post
     * @param postId ID do post
     * @returns Objeto PostEmbedding
     */
    public async getPostEmbedding(postId: bigint): Promise<PostEmbeddingType> {
        try {
            // Buscar embedding existente
            const storedEmbedding = await PostEmbedding.findOne({
                where: { postId: String(postId) }
            })

            // Se existir e for recente, retornar
            if (storedEmbedding && this.isEmbeddingRecent(storedEmbedding.updatedAt)) {
                return storedEmbedding.toPostEmbeddingType()
            }

            // Se não existir ou for antigo, gerar um novo
            const postData = await this.collectPostData(postId)
            const newEmbedding = await this.generateEmbedding(postData)

            // Criar ou atualizar o embedding no banco
            const [embedding] = await PostEmbedding.upsert({
                postId: String(postId),
                vector: JSON.stringify(newEmbedding),
                dimension: this.dimension,
                metadata: {
                    createdAt: new Date().toISOString(),
                    contentTopics: postData.tags,
                    contentLength: postData.textContent.length,
                    authorId: String(postData.authorId),
                }
            })

            return embedding.toPostEmbeddingType()
        } catch (error: any) {
            this.logger.error(`Erro ao obter embedding do post ${postId}: ${error.message}`)
            throw new Error(`Falha ao obter embedding do post: ${error.message}`)
        }
    }

    /**
     * Gera embeddings para um lote de posts
     * @param postIds Lista de IDs de posts
     * @returns Mapa de IDs para objetos PostEmbedding
     */
    public async batchGenerateEmbeddings(postIds: bigint[]): Promise<Map<string, PostEmbeddingType>> {
        const results = new Map<string, PostEmbeddingType>()
        const batchSize = Params.batchProcessing.size

        for (let i = 0; i < postIds.length; i += batchSize) {
            const batch = postIds.slice(i, i + batchSize)
            const batchPromises = batch.map(async (postId) => {
                try {
                    const embedding = await this.getPostEmbedding(postId)
                    return { postId, embedding }
                } catch (error) {
                    this.logger.error(`Erro ao processar post ${postId}:`, error)
                    return null
                }
            })

            const batchResults = await Promise.all(batchPromises)
            batchResults.forEach((result) => {
                if (result) {
                    results.set(String(result.postId), result.embedding)
                }
            })
        }

        return results
    }

    // Métodos auxiliares

    /**
     * Extrai embedding do texto do post
     */
    private async extractTextEmbedding(text: string): Promise<number[]> {
        if (!text || text.trim().length === 0) {
            return new Array(this.dimension).fill(0) // Vetor zerado para textos vazios
        }

        // Em uma implementação real, usaríamos o modelo NLP carregado
        return this.model.embed(text)
    }

    /**
     * Extrai embedding das tags do post
     */
    private async extractTagsEmbedding(tags: string[]): Promise<number[]> {
        if (tags.length === 0) {
            return new Array(this.dimension).fill(0) // Vetor zerado para posts sem tags
        }

        // Concatenar todas as tags e usar o modelo para gerar embedding
        const tagText = tags.join(" ")
        return this.model.embed(tagText)
    }

    /**
     * Extrai embedding baseado nas métricas de engajamento
     */
    private extractEngagementEmbedding(metrics: Partial<EngagementMetrics>): number[] {
        const engagementVector = [
            metrics.views || 0,
            metrics.likes || 0,
            metrics.comments || 0,
            metrics.shares || 0,
            metrics.saves || 0,
            metrics.engagementRate || 0,
        ]

        const normalizedVector = engagementVector.map(
            (val) => (val > 0 ? Math.log10(1 + val) / Params.normalization.engagementScaleFactor : 0)
        )

        return resizeVector(normalizedVector, this.dimension)
    }

    /**
     * Calcula o peso para uma atualização com base na recência
     */
    private calculateUpdateWeight(lastInteraction?: Date): number {
        if (!lastInteraction) {
            return Params.weights.update.default
        }

        const now = Date.now()
        const interactionTime = lastInteraction.getTime()
        const hoursSinceInteraction = (now - interactionTime) / (1000 * 60 * 60)

        return Math.max(
            Params.decay.interactionWeight.minimum,
            Math.exp(-hoursSinceInteraction / Params.decay.interactionWeight.base)
        )
    }

    /**
     * Verifica se um embedding é considerado recente
     */
    private isEmbeddingRecent(lastUpdated: Date): boolean {
        return Date.now() - lastUpdated.getTime() < Params.timeWindows.recentEmbeddingUpdate
    }

    /**
     * Coleta dados de um post para gerar seu embedding
     */
    private async collectPostData(postId: bigint): Promise<PostEmbeddingProps> {
        const post = await PostEmbedding.sequelize?.models.Moment.findByPk(postId, {
            include: [
                { association: 'tags' },
                { association: 'moment_statistics' },
                { association: 'moment_interactions' }
            ]
        }) as any; // Usar type assertion temporário
        
        if (!post) {
            throw new Error(`Post não encontrado: ${postId}`)
        }

        // Acessar propriedades via getDataValue
        const stats = post.getDataValue('moment_statistics') || {}
        const interactions = post.getDataValue('moment_interactions') || {}

        return {
            textContent: post.getDataValue('description') || "",
            tags: post.tags?.map((tag: any) => tag.getDataValue('name')) || [],
            engagementMetrics: {
                views: stats.view_count || 0,
                likes: stats.like_count || 0,
                comments: stats.comment_count || 0,
                shares: stats.share_count || 0,
                saves: stats.save_count || 0,
                engagementRate: this.calculateEngagementRate(stats),
            },
            authorId: post.getDataValue('user_id'),
            createdAt: post.getDataValue('createdAt'),
        }
    }

    /**
     * Calcula a taxa de engajamento de um post
     */
    private calculateEngagementRate(stats: any): number {
        const viewCount = stats.view_count || 0
        if (viewCount === 0) return 0

        const engagements = 
            (stats.like_count || 0) +
            (stats.comment_count || 0) +
            (stats.share_count || 0) +
            (stats.save_count || 0)

        return engagements / viewCount
    }

    /**
     * Função simple de hash para simulação
     */
    private simpleHash(text: string): number {
        let hash = 0
        if (text.length === 0) return hash

        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash // Convert to 32bit integer
        }

        return Math.abs(hash) / 2147483647 // Normalize to 0-1
    }

    /**
     * Encontra posts similares com base em um post de referência
     * @param postId ID do post de referência
     * @param limit Número máximo de posts a retornar
     * @param minSimilarity Similaridade mínima (0-1)
     * @returns Lista de posts similares com valores de similaridade
     */
    public async findSimilarPosts(
        postId: bigint,
        limit: number = Params.similarity.defaultLimit,
        minSimilarity: number = Params.similarity.minimumThreshold
    ): Promise<Array<{ id: bigint; similarity: number }>> {
        try {
            const referenceEmbedding = await this.getPostEmbedding(postId)
            if (!referenceEmbedding) {
                throw new Error(`Post não encontrado: ${postId}`)
            }

            // Buscar embeddings recentes
            const recentEmbeddings = await PostEmbedding.findAll({
                where: {
                    postId: {
                        [Op.ne]: String(postId)
                    },
                    updatedAt: {
                        [Op.gte]: new Date(Date.now() - Params.timeWindows.recentEmbeddingUpdate)
                    }
                },
                limit: limit * 10,
                order: [['updatedAt', 'DESC']]
            })

            const similarities: Array<{ id: bigint; similarity: number }> = []

            for (const candidateEmbedding of recentEmbeddings) {
                const similarity = this.calculateCosineSimilarity(
                    referenceEmbedding.vector.values,
                    JSON.parse(candidateEmbedding.vector)
                )

                if (similarity >= minSimilarity) {
                    similarities.push({ 
                        id: BigInt(candidateEmbedding.postId), 
                        similarity 
                    })
                }
            }

            return similarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
        } catch (error: any) {
            this.logger.error(`Erro ao buscar posts similares: ${error.message}`)
            return []
        }
    }

    /**
     * Calcula a similaridade de cosseno entre dois vetores
     */
    private calculateCosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error("Vetores com dimensões diferentes")
        }

        let dotProduct = 0
        let normA = 0
        let normB = 0

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i]
            normA += a[i] * a[i]
            normB += b[i] * b[i]
        }

        if (normA === 0 || normB === 0) {
            return 0
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
    }

    private createEmbeddingVector(embedding: number[]): { values: number[]; dimension: number } {
        return {
            values: embedding,
            dimension: this.dimension
        }
    }

    /**
     * Constrói um novo embedding para um post
     */
    public async build(data: PostEmbeddingProps): Promise<EmbeddingVector> {
        try {
            if (!this.validateData(data)) {
                throw new Error("Dados inválidos para construção do embedding")
            }

            await this.loadModel()

            // 1. Extrair embedding do texto
            const textEmbedding = await this.extractTextEmbedding(data.textContent)

            // 2. Extrair embedding das tags
            const tagsEmbedding = await this.extractTagsEmbedding(data.tags)

            // 3. Extrair embedding baseado no engajamento
            const engagementEmbedding = this.extractEngagementEmbedding(data.engagementMetrics)

            // 4. Combinar os embeddings com pesos
            const combinedEmbedding = combineVectors(
                [textEmbedding, tagsEmbedding, engagementEmbedding],
                [this.WEIGHT_TEXT, this.WEIGHT_TAGS, this.WEIGHT_ENGAGEMENT]
            )

            // 5. Normalizar o resultado
            const normalizedVector = normalizeL2(combinedEmbedding)

            // 6. Criar o embedding final
            return {
                values: normalizedVector,
                dimension: this.dimension,
                metadata: {
                    contentTopics: data.tags,
                    contentLength: data.textContent.length,
                    authorId: data.authorId.toString(),
                    createdAt: new Date().toISOString(),
                    modelVersion: "1.0",
                    engagementStats: {
                        totalViews: data.engagementMetrics.views,
                        totalLikes: data.engagementMetrics.likes,
                        totalComments: data.engagementMetrics.comments,
                        engagementRate: data.engagementMetrics.engagementRate
                    }
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        } catch (error) {
            this.logger.error(`Erro ao construir embedding: ${error}`)
            throw error
        }
    }

    private validateData(data: PostEmbeddingProps): boolean {
        return (
            typeof data.textContent === "string" &&
            Array.isArray(data.tags) &&
            typeof data.engagementMetrics === "object" &&
            data.engagementMetrics !== null &&
            typeof data.authorId === "bigint" &&
            data.createdAt instanceof Date
        )
    }
}
