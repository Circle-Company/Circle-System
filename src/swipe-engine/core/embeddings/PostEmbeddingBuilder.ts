import { Op } from "sequelize"
import Moment from "../../../models/moments/moment-model"
import MomentStatistic from "../../../models/moments/moment_statistic-model.js"
import MomentTag from "../../../models/moments/moment_tag-model.js"
import Tag from "../../../models/tags/tag-model"
import PostEmbedding from "../../models/PostEmbedding"
import { EmbeddingVector, EngagementMetrics, PostEmbedding as PostEmbeddingType } from "../types"
import { getLogger } from "../utils/logger"

/**
 * Serviço responsável por gerar embeddings para posts
 */
export class PostEmbeddingBuilder {
    private readonly logger = getLogger("PostEmbeddingBuilder")
    private readonly defaultDimension = 128

    constructor() {
        this.logger.info("PostEmbeddingBuilder inicializado")
    }

    /**
     * Gera um embedding para um post específico
     */
    public async generatePostEmbedding(postId: bigint): Promise<PostEmbeddingType | null> {
        try {
            this.logger.info(`Gerando embedding para post ${postId}`)

            // 1. Buscar dados do post
            const post = await Moment.findByPk(postId.toString(), {
                include: [
                    {
                        model: MomentTag,
                        as: "tags",
                        include: [{ model: Tag, as: "tag" }],
                    },
                    {
                        model: MomentStatistic,
                        as: "statistics",
                    },
                ],
            })

            if (!post) {
                throw new Error(`Post ${postId} não encontrado`)
            }

            // 2. Extrair conteúdo textual e tags
            const textContent = post.get("description") || ""
            const tags = this.extractTags(post)

            // 3. Obter métricas de engajamento
            const engagementMetrics = this.extractEngagementMetrics(post)

            // 4. Gerar o embedding combinado com base no texto, tags e engajamento
            const embeddingVector = await this.createEmbeddingVector(
                textContent,
                tags,
                engagementMetrics
            )

            // 5. Salvar ou atualizar no banco de dados
            const metadata = {
                textLength: textContent.length,
                tagCount: tags.length,
                engagementScore: engagementMetrics.engagementRate,
                processedAt: new Date().toISOString(),
            }

            const [embedding, created] = await PostEmbedding.findOrCreate({
                where: { postId: postId.toString() },
                defaults: {
                    postId: postId.toString(),
                    vector: JSON.stringify(embeddingVector.values),
                    dimension: embeddingVector.dimension,
                    metadata,
                },
            })

            if (!created) {
                // Atualizar embedding existente
                await embedding.update({
                    vector: JSON.stringify(embeddingVector.values),
                    metadata: {
                        ...embedding.metadata,
                        ...metadata,
                    },
                })
            }

            return {
                postId: postId.toString(),
                vector: embeddingVector,
                metadata: embedding.metadata,
            }
        } catch (error: any) {
            this.logger.error(`Erro ao gerar embedding para post ${postId}: ${error.message}`)
            return null
        }
    }

    /**
     * Extrai as tags associadas ao post
     */
    private extractTags(post: any): string[] {
        try {
            if (!post.tags || !Array.isArray(post.tags)) {
                return []
            }

            return post.tags
                .filter((tagRelation: any) => tagRelation && tagRelation.tag)
                .map((tagRelation: any) => tagRelation.tag.name)
        } catch (error) {
            this.logger.error("Erro ao extrair tags do post")
            return []
        }
    }

    /**
     * Extrai métricas de engajamento do post
     */
    private extractEngagementMetrics(post: any): EngagementMetrics {
        try {
            const statistics = post.statistics || {}

            const views = statistics.views_num || 0
            const likes = statistics.likes_num || 0
            const comments = statistics.comments_num || 0
            const shares = statistics.shares_num || 0
            const saves = statistics.saves_num || 0

            // Calcular taxa de engajamento total
            const totalInteractions = likes + comments + shares + saves
            const engagementRate = views > 0 ? totalInteractions / views : 0

            return {
                views,
                likes,
                comments,
                shares,
                saves,
                engagementRate,
            }
        } catch (error) {
            this.logger.error("Erro ao extrair métricas de engajamento do post")
            return {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                saves: 0,
                engagementRate: 0,
            }
        }
    }

    /**
     * Cria o vetor de embedding combinando texto, tags e engajamento
     * Na implementação real, isso usaria um modelo de ML ou serviço de AI
     */
    private async createEmbeddingVector(
        textContent: string,
        tags: string[],
        engagementMetrics: EngagementMetrics
    ): Promise<EmbeddingVector> {
        try {
            // Implementação simplificada - na versão real usaria um modelo ML
            // ou serviço de AI para extrair características significativas

            // Criar vetor com valores aleatórios normalizados
            const values = Array(this.defaultDimension)
                .fill(0)
                .map(() => Math.random() * 2 - 1) // valores entre -1 e 1

            // Normalizar vetor para ter comprimento unitário
            const magnitude = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0))
            const normalizedValues = values.map((val) => val / magnitude)

            return {
                dimension: this.defaultDimension,
                values: normalizedValues,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        } catch (error) {
            this.logger.error("Erro ao criar vetor de embedding para post")

            // Retornar um vetor padrão em caso de erro
            const defaultValues = Array(this.defaultDimension).fill(0)
            defaultValues[0] = 1 // Para evitar vetor nulo

            return {
                dimension: this.defaultDimension,
                values: defaultValues,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        }
    }

    /**
     * Atualiza embeddings de posts em massa (para uso em jobs programados)
     */
    public async updatePostEmbeddings(
        limit: number = 100,
        olderThanDays: number = 7
    ): Promise<number> {
        try {
            // Obter a data limite
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

            // Obter posts com embeddings mais antigos ou sem embedding
            const posts = await Moment.findAll({
                limit,
                where: {
                    [Op.and]: [
                        {
                            // @ts-ignore - Moment model uses snake_case fields
                            created_at: {
                                [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                            },
                        },
                    ],
                },
                include: [
                    {
                        model: PostEmbedding,
                        as: "embedding",
                        required: false,
                        where: {
                            [Op.or]: [{ updatedAt: { [Op.lt]: cutoffDate } }, { id: null }],
                        },
                    },
                ],
            })

            let updatedCount = 0
            for (const post of posts) {
                await this.generatePostEmbedding(BigInt(post.id))
                updatedCount++
            }

            return updatedCount
        } catch (error: any) {
            this.logger.error(`Erro ao atualizar embeddings em massa: ${error.message}`)
            return 0
        }
    }
}
