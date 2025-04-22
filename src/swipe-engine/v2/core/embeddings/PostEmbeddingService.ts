/**
 * Serviço de embedding para posts/conteúdos
 */

import { EngagementMetrics, PostEmbedding, PostEmbeddingProps, UpdatedPostStats } from "../types"
import { getLogger } from "../utils/logger"
import { normalizeL2 } from "../utils/normalization"
import { combineVectors, resizeVector } from "../utils/vector-operations"
import { BaseEmbeddingService } from "./BaseEmbeddingService"

// Definição das interfaces para repositórios
export interface IPostRepository {
    findById(postId: bigint): Promise<any>
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
export class PostEmbeddingService extends BaseEmbeddingService<
    PostEmbeddingProps,
    UpdatedPostStats
> {
    private postRepository: IPostRepository
    private postEmbeddingRepository: IPostEmbeddingRepository
    private tagRepository: ITagRepository
    private readonly logger = getLogger("PostEmbeddingService")

    // Pesos para diferentes componentes do embedding
    private readonly WEIGHT_TEXT = 0.5
    private readonly WEIGHT_TAGS = 0.3
    private readonly WEIGHT_ENGAGEMENT = 0.2

    constructor(
        dimension: number = 128,
        modelPath: string = "models/post_embedding_model",
        postRepository: IPostRepository,
        postEmbeddingRepository: IPostEmbeddingRepository,
        tagRepository: ITagRepository
    ) {
        super(dimension, modelPath)
        this.postRepository = postRepository
        this.postEmbeddingRepository = postEmbeddingRepository
        this.tagRepository = tagRepository
    }

    /**
     * Implementação do método abstrato para carregar o modelo
     */
    protected async loadModelImplementation(): Promise<any> {
        // Em uma implementação real, carregaria um modelo de NLP como TensorFlow.js
        // Por enquanto, simulamos um modelo simples
        this.logger.info("Carregando modelo de embedding de posts...")
        return {
            embed: (text: string) => {
                // Simulação simplificada de embedding - em produção, usaríamos um modelo real
                const hash = this.simpleHash(text)
                const embedding = new Array(this.dimension).fill(0)

                // Preenchemos o vetor com valores baseados em hash
                for (let i = 0; i < this.dimension; i++) {
                    embedding[i] = (Math.sin(hash * (i + 1)) + 1) / 2 // Valor entre 0 e 1
                }

                return normalizeL2(embedding)
            },
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
        currentEmbedding: number[],
        updates: UpdatedPostStats
    ): Promise<number[]> {
        // Se temos novas métricas de engajamento, atualizamos o embedding
        if (updates.engagementMetrics) {
            // 1. Extrair nova embedding de engajamento
            const newEngagementEmbedding = this.extractEngagementEmbedding(
                updates.engagementMetrics
            )

            // 2. Calcular o peso da atualização (mais recente = mais peso)
            const updateWeight = this.calculateUpdateWeight(updates.lastInteraction)

            // 3. Combinar o embedding atual com o novo embedding de engajamento
            const updatedEmbedding = currentEmbedding.map(
                (val, idx) =>
                    val * (1 - updateWeight * this.WEIGHT_ENGAGEMENT) +
                    newEngagementEmbedding[idx] * (updateWeight * this.WEIGHT_ENGAGEMENT)
            )

            // 4. Normalizar e retornar
            return normalizeL2(updatedEmbedding)
        }

        // Se não há novas métricas, retornamos o embedding atual
        return currentEmbedding
    }

    /**
     * Recupera ou gera o embedding para um post
     * @param postId ID do post
     * @returns Objeto PostEmbedding
     */
    public async getPostEmbedding(postId: bigint): Promise<PostEmbedding> {
        try {
            // 1. Tentar recuperar embedding existente
            const storedEmbedding = await this.postEmbeddingRepository.findByPostId(postId)

            // 2. Se existir e for recente, retornar
            if (storedEmbedding && this.isEmbeddingRecent(storedEmbedding.lastUpdated)) {
                return {
                    postId: String(postId),
                    vector: this.createEmbeddingVector(storedEmbedding.embedding),
                    metadata: storedEmbedding.metadata,
                }
            }

            // 3. Se não existir ou for antigo, gerar um novo
            // 3.1 Buscar dados do post
            const postData = await this.collectPostData(postId)

            // 3.2 Gerar novo embedding
            const newEmbedding = await this.generateEmbedding(postData)

            // 3.3 Criar objeto de embedding
            const postEmbedding: PostEmbedding = {
                postId: String(postId),
                vector: this.createEmbeddingVector(newEmbedding),
                metadata: {
                    createdAt: new Date().toISOString(),
                    contentTopics: postData.tags,
                    contentLength: postData.textContent.length,
                    authorId: String(postData.authorId),
                },
            }

            // 3.4 Persistir o novo embedding
            await this.postEmbeddingRepository.saveOrUpdate({
                postId,
                embedding: newEmbedding,
                lastUpdated: new Date(),
                version: storedEmbedding ? storedEmbedding.version + 1 : 1,
                metadata: postEmbedding.metadata,
            })

            return postEmbedding
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
    public async batchGenerateEmbeddings(postIds: bigint[]): Promise<Map<string, PostEmbedding>> {
        const results = new Map<string, PostEmbedding>()

        // Processar em lotes para não sobrecarregar o sistema
        const batchSize = 100
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
        // Criamos um vetor representando diferentes aspectos de engajamento
        const engagementVector = [
            metrics.views || 0,
            metrics.likes || 0,
            metrics.comments || 0,
            metrics.shares || 0,
            metrics.saves || 0,
            metrics.engagementRate || 0,
        ]

        // Normalizar valores - logaritmo para comprimir valores grandes
        const normalizedVector = engagementVector.map(
            (val) => (val > 0 ? Math.log10(1 + val) / 5 : 0) // Divide por 5 para manter valores entre 0-1 na maioria dos casos
        )

        // Expandir para a dimensão correta
        return resizeVector(normalizedVector, this.dimension)
    }

    /**
     * Calcula o peso para uma atualização com base na recência
     */
    private calculateUpdateWeight(lastInteraction?: Date): number {
        if (!lastInteraction) {
            return 0.5 // Peso padrão para atualizações sem data
        }

        const now = Date.now()
        const interactionTime = lastInteraction.getTime()
        const hoursSinceInteraction = (now - interactionTime) / (1000 * 60 * 60)

        // Mais recente = mais peso, com decaimento exponencial
        return Math.max(0.1, Math.exp(-hoursSinceInteraction / 24))
    }

    /**
     * Verifica se um embedding é considerado recente
     */
    private isEmbeddingRecent(lastUpdated: Date): boolean {
        // Consideramos um embedding recente se foi atualizado nas últimas 24 horas
        const ONE_DAY = 24 * 60 * 60 * 1000
        return Date.now() - lastUpdated.getTime() < ONE_DAY
    }

    /**
     * Coleta dados de um post para gerar seu embedding
     */
    private async collectPostData(postId: bigint): Promise<PostEmbeddingProps> {
        // Em uma implementação real, buscaríamos no banco de dados
        const post = await this.postRepository.findById(postId)
        const tags = await this.tagRepository.findTagsForPost(postId)

        if (!post) {
            throw new Error(`Post não encontrado: ${postId}`)
        }

        return {
            textContent: post.content || "",
            tags: tags || [],
            engagementMetrics: {
                views: post.viewCount || 0,
                likes: post.likeCount || 0,
                comments: post.commentCount || 0,
                shares: post.shareCount || 0,
                saves: post.saveCount || 0,
                engagementRate: this.calculateEngagementRate(post),
            },
            authorId: post.authorId,
            createdAt: post.createdAt,
        }
    }

    /**
     * Calcula a taxa de engajamento de um post
     */
    private calculateEngagementRate(post: any): number {
        if (!post.viewCount || post.viewCount === 0) {
            return 0
        }

        const engagements =
            (post.likeCount || 0) +
            (post.commentCount || 0) +
            (post.shareCount || 0) +
            (post.saveCount || 0)

        return engagements / post.viewCount
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
}
