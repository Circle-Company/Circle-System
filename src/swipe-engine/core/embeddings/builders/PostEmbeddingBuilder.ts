import { IEmbeddingBuilder } from "./BaseEmbeddingBuilder"
import { EmbeddingVector, PostEmbeddingProps } from "../../types"
import { EmbeddingParams as Params } from "../../../params"
import { normalizeL2 } from "../../utils/normalization"
import { combineVectors, resizeVector } from "../../utils/vector-operations"

export class PostEmbeddingBuilder implements IEmbeddingBuilder<PostEmbeddingProps> {
    private readonly dimension: number

    constructor(dimension: number = Params.dimensions.embedding) {
        this.dimension = dimension
    }

    async build(data: PostEmbeddingProps): Promise<EmbeddingVector> {
        if (!this.validate(data)) {
            throw new Error("Dados inválidos para construção do embedding")
        }

        // 1. Extrair embedding do texto
        const textEmbedding = await this.extractTextEmbedding(data.textContent)

        // 2. Extrair embedding das tags
        const tagsEmbedding = await this.extractTagsEmbedding(data.tags)

        // 3. Extrair embedding baseado no engajamento
        const engagementEmbedding = this.extractEngagementEmbedding(data.engagementMetrics)

        // 4. Combinar os embeddings com pesos
        const combinedEmbedding = combineVectors(
            [textEmbedding, tagsEmbedding, engagementEmbedding],
            [
                Params.weights.content.text,
                Params.weights.content.tags,
                Params.weights.content.engagement,
            ]
        )

        // 5. Normalizar o resultado
        const normalizedVector = normalizeL2(combinedEmbedding)

        return {
            values: normalizedVector,
            dimension: this.dimension,
            metadata: this.generateMetadata(data),
            createdAt: new Date(),
            updatedAt: new Date()
        }
    }

    async update(
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

        const updatedVector = combineVectors(
            [currentEmbedding.values, newEmbedding.values],
            [0.7, 0.3]
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

    validate(data: PostEmbeddingProps): boolean {
        return (
            typeof data.textContent === "string" &&
            Array.isArray(data.tags) &&
            typeof data.engagementMetrics === "object"
        )
    }

    private async extractTextEmbedding(text: string): Promise<number[]> {
        if (!text || text.trim().length === 0) {
            return new Array(this.dimension).fill(0)
        }

        // Simulação de extração de embedding de texto
        const hash = this.simpleHash(text)
        const embedding = new Array(this.dimension).fill(0)

        for (let i = 0; i < this.dimension; i++) {
            embedding[i] = (Math.sin(hash * (i + 1)) + 1) / 2
        }

        return normalizeL2(embedding)
    }

    private async extractTagsEmbedding(tags: string[]): Promise<number[]> {
        if (tags.length === 0) {
            return new Array(this.dimension).fill(0)
        }

        const tagText = tags.join(" ")
        return this.extractTextEmbedding(tagText)
    }

    private extractEngagementEmbedding(metrics: any): number[] {
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

    private generateMetadata(data: PostEmbeddingProps): Record<string, any> {
        return {
            contentTopics: data.tags,
            contentLength: data.textContent.length,
            authorId: data.authorId,
            createdAt: new Date().toISOString(),
        }
    }

    private simpleHash(text: string): number {
        let hash = 0
        if (text.length === 0) return hash

        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash
        }

        return Math.abs(hash) / 2147483647
    }
} 