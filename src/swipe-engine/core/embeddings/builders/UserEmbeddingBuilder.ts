import { IEmbeddingBuilder } from "./BaseEmbeddingBuilder"
import { EmbeddingVector, UserEmbeddingProps, UserInteraction } from "../../types"
import { EmbeddingParams as Params } from "../../../params"
import { normalizeL2 } from "../../utils/normalization"
import { combineVectors, resizeVector } from "../../utils/vector-operations"

export class UserEmbeddingBuilder implements IEmbeddingBuilder<UserEmbeddingProps> {
    private readonly dimension: number

    constructor(dimension: number = Params.dimensions.embedding) {
        this.dimension = dimension
    }

    async build(data: UserEmbeddingProps): Promise<EmbeddingVector> {
        if (!this.validate(data)) {
            throw new Error("Dados inválidos para construção do embedding")
        }

        // 1. Processar histórico de interações
        const interactionFeatures = this.processInteractionHistory(data.interactionHistory)

        // 2. Processar padrões de visualização
        const viewingFeatures = this.processViewingPatterns(data.viewingPatterns)

        // 3. Processar preferências de conteúdo
        const preferenceFeatures = this.processContentPreferences(data.contentPreferences)

        // 4. Processar informações demográficas (opcional)
        const demographicFeatures = data.demographicInfo
            ? this.processDemographicInfo(data.demographicInfo)
            : []

        // 5. Combinar todos os vetores
        const combinedFeatures = [
            ...interactionFeatures,
            ...viewingFeatures,
            ...preferenceFeatures,
            ...demographicFeatures,
        ]

        // 6. Redimensionar para a dimensão correta
        const resizedFeatures = resizeVector(combinedFeatures, this.dimension)

        // 7. Normalizar o vetor final
        const normalizedVector = normalizeL2(resizedFeatures)

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
        newData: Partial<UserEmbeddingProps>
    ): Promise<EmbeddingVector> {
        // Implementar lógica de atualização incremental
        const newEmbedding = await this.build({
            ...newData,
            interactionHistory: newData.interactionHistory || [],
            viewingPatterns: newData.viewingPatterns || [],
            contentPreferences: newData.contentPreferences || [],
        })

        // Combinar embeddings com pesos
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

    validate(data: UserEmbeddingProps): boolean {
        return (
            Array.isArray(data.interactionHistory) &&
            Array.isArray(data.viewingPatterns) &&
            Array.isArray(data.contentPreferences)
        )
    }

    private processInteractionHistory(interactions: UserInteraction[]): number[] {
        const result = new Array(Params.dimensions.interactionHistory).fill(0)
        const interactionsByType: Record<string, number> = {}

        interactions.forEach((interaction) => {
            const type = interaction.type
            interactionsByType[type] = (interactionsByType[type] || 0) + 1
        })

        const types = ["view", "like", "comment", "share", "save"]
        types.forEach((type, index) => {
            result[index] = interactionsByType[type] || 0
        })

        return normalizeL2(result)
    }

    private processViewingPatterns(patterns: any[]): number[] {
        const result = new Array(Params.dimensions.socialFeatures).fill(0)

        patterns.forEach((pattern, index) => {
            if (index < 10) {
                result[index * 3] = pattern.averageDuration / 100
                result[index * 3 + 1] = pattern.completionRate
                result[index * 3 + 2] = Math.min(pattern.frequency / 10, 1)
            }
        })

        return result
    }

    private processContentPreferences(preferences: string[]): number[] {
        const result = new Array(Params.dimensions.contentPreferences).fill(0)
        const preferenceMap: Record<string, number> = {
            esportes: 0,
            música: 1,
            filmes: 2,
            notícias: 3,
            tecnologia: 4,
            comida: 5,
            viagem: 6,
            moda: 7,
            jogos: 8,
            arte: 9,
        }

        preferences.forEach((pref) => {
            const index = preferenceMap[pref.toLowerCase()]
            if (index !== undefined && index < result.length) {
                result[index] = 1.0
            }
        })

        return result
    }

    private processDemographicInfo(demographics: any): number[] {
        const result = new Array(Params.dimensions.socialFeatures).fill(0)

        if (demographics.ageRange) {
            const ageMap: Record<string, number> = {
                "13-17": 0,
                "18-24": 1,
                "25-34": 2,
                "35-44": 3,
                "45-54": 4,
                "55+": 5,
            }

            const ageIndex = ageMap[demographics.ageRange]
            if (ageIndex !== undefined) {
                result[0] = ageIndex / 5
            }
        }

        return result
    }

    private generateMetadata(data: UserEmbeddingProps): Record<string, any> {
        return {
            dominantInterests: data.contentPreferences?.slice(0, 5) || [],
            activenessFactor: this.calculateActivenessFactor(data.interactionHistory),
            lastCalculated: new Date().toISOString(),
        }
    }

    private calculateActivenessFactor(interactions: UserInteraction[]): number {
        if (interactions.length === 0) return 0

        const recentCount = interactions.filter(
            (i) => Date.now() - i.timestamp.getTime() < Params.timeWindows.interactionHistory
        ).length

        return Math.min(recentCount / 100, 1)
    }
} 