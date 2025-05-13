/**
 * Serviço de embedding para usuários
 */

import { Op } from "sequelize"
import InteractionEvent from "../../models/InteractionEvent"
import UserEmbedding from "../../models/UserEmbedding"
import { UserEmbeddingProps, UserEmbedding as UserEmbeddingType, UserInteraction } from "../types"
import { getLogger } from "../utils/logger"
import { normalizeL2 } from "../utils/normalization"
import { resizeVector } from "../utils/vector-operations"
import { BaseEmbeddingService } from "./BaseEmbeddingService"
import { EmbeddingParams as Params } from "../../params"

// Interface para representar métricas de visualização
interface ViewMetrics {
    contentType: string
    averageDuration: number
    completionRate: number
    frequency: number
}

// Interface para representar informações demográficas do usuário
interface UserDemographics {
    ageRange?: string
    location?: string
    languages?: string[]
    interests?: string[]
}

export interface IInteractionRepository {
    findByUserId(userId: bigint, limit?: number): Promise<UserInteraction[]>
    // outros métodos do repositório
}

export interface IUserEmbeddingRepository {
    findByUserId(userId: bigint): Promise<{
        userId: bigint
        embedding: number[]
        lastUpdated: Date
        version: number
        metadata?: Record<string, any>
    } | null>
    saveOrUpdate(data: {
        userId: bigint
        embedding: number[]
        lastUpdated: Date
        version: number
        metadata?: Record<string, any>
    }): Promise<void>
    // outros métodos do repositório
}

export class UserEmbeddingService extends BaseEmbeddingService<
    UserEmbeddingProps,
    UserInteraction
> {
    private interactionRepository: IInteractionRepository
    private userEmbeddingRepository: IUserEmbeddingRepository
    private readonly logger = getLogger("UserEmbeddingService")
    private readonly defaultDimension = Params.dimensions.embedding

    constructor(
        embeddingDimension: number = Params.dimensions.embedding,
        modelPath: string = "models/user_embedding_model",
        interactionRepository: IInteractionRepository,
        userEmbeddingRepository: IUserEmbeddingRepository
    ) {
        super(embeddingDimension, modelPath)
        this.interactionRepository = interactionRepository
        this.userEmbeddingRepository = userEmbeddingRepository
        this.logger.info("UserEmbeddingService inicializado")
    }

    // Implementação do método abstrato para carregar o modelo
    protected async loadModelImplementation(): Promise<any> {
        // Em uma implementação real, carregaria um modelo como TensorFlow.js
        // Por enquanto, vamos simular um modelo simples
        this.logger.info("Carregando modelo de embedding de usuário...")
        return {
            predict: (input: any) => {
                // Simulação básica de um modelo
                return input
            },
        }
    }

    // Gera embedding do usuário a partir de seus dados
    async generateEmbedding(userData: UserEmbeddingProps): Promise<number[]> {
        await this.loadModel() // Garante que o modelo está carregado

        const { interactionHistory, viewingPatterns, contentPreferences, demographicInfo } =
            userData

        // 1. Processar histórico de interações
        const interactionFeatures = this.processInteractionHistory(interactionHistory)

        // 2. Processar padrões de visualização
        const viewingFeatures = this.processViewingPatterns(viewingPatterns)

        // 3. Processar preferências de conteúdo
        const preferenceFeatures = this.processContentPreferences(contentPreferences)

        // 4. Processar informações demográficas (opcional)
        const demographicFeatures = demographicInfo
            ? this.processDemographicInfo(demographicInfo)
            : []

        // 5. Combinar todos os vetores de características
        const combinedFeatures = [
            ...interactionFeatures,
            ...viewingFeatures,
            ...preferenceFeatures,
            ...demographicFeatures,
        ]

        // 6. Caso o vetor combinado não tenha a dimensão correta, redimensionar
        const resizedFeatures = resizeVector(combinedFeatures, this.dimension)

        // 7. Usar o modelo para gerar o embedding final (em uma implementação real)
        // No nosso caso simulado, vamos apenas normalizar o vetor
        return normalizeL2(resizedFeatures)
    }

    // Atualiza o embedding atual com base em novas interações
    async updateEmbedding(
        currentEmbedding: number[],
        interaction: UserInteraction
    ): Promise<number[]> {
        // Determinar o peso da atualização com base no tipo de interação
        const interactionWeight = this.getInteractionWeight(interaction.type)

        // Extrair características da interação
        const interactionFeatures = this.extractInteractionFeatures(interaction)

        // Gerar embedding da interação
        const interactionEmbedding = await this.generateInteractionEmbedding(interactionFeatures)

        // Atualizar o embedding atual com o embedding da interação
        const updatedEmbedding = currentEmbedding.map((val, idx) => {
            return val * (1 - interactionWeight) + interactionEmbedding[idx] * interactionWeight
        })

        // Normalizar o embedding atualizado
        return normalizeL2(updatedEmbedding)
    }

    // Recupera ou gera o embedding para um usuário
    async getUserEmbedding(userId: bigint): Promise<UserEmbeddingType | null> {
        try {
            const embedding = await UserEmbedding.findOne({
                where: { userId: userId.toString() },
            })

            if (!embedding) return null

            // Usar o método toUserEmbeddingType do modelo
            return embedding.toUserEmbeddingType()
        } catch (error: any) {
            this.logger.error(`Erro ao buscar embedding do usuário ${userId}: ${error.message}`)
            return null
        }
    }

    // Métodos auxiliares

    private processInteractionHistory(interactions: UserInteraction[]): number[] {
        // Processamento do histórico de interações para extração de características
        const result = new Array(Params.dimensions.interactionHistory).fill(0)

        // Agrupa interações por tipo
        const interactionsByType: Record<string, number> = {}

        interactions.forEach((interaction) => {
            const type = interaction.type
            interactionsByType[type] = (interactionsByType[type] || 0) + 1
        })

        // Preenche o vetor com contagens normalizadas
        const types = ["view", "like", "comment", "share", "save"]
        types.forEach((type, index) => {
            result[index] = interactionsByType[type] || 0
        })

        return normalizeL2(result)
    }

    private processViewingPatterns(patterns: ViewMetrics[]): number[] {
        // Processamento dos padrões de visualização para extração de características
        // Implementação simplificada para exemplo
        const result = new Array(30).fill(0)

        patterns.forEach((pattern, index) => {
            if (index < 10) {
                result[index * 3] = pattern.averageDuration / 100 // Normalizado para 0-1
                result[index * 3 + 1] = pattern.completionRate // Já entre 0-1
                result[index * 3 + 2] = Math.min(pattern.frequency / 10, 1) // Capped at 1
            }
        })

        return result
    }

    private processContentPreferences(preferences: string[]): number[] {
        const result = new Array(Params.dimensions.contentPreferences).fill(0)
        // ... resto do código existente ...
        return result
    }

    private processDemographicInfo(demographics: UserDemographics): number[] {
        const result = new Array(Params.dimensions.socialFeatures).fill(0)
        // ... resto do código existente ...
        return result
    }

    private getInteractionWeight(interactionType: string): number {
        const weights: Record<string, number> = {
            view: Params.weights.interactions.view,
            like: Params.weights.interactions.like,
            comment: Params.weights.interactions.comment,
            share: Params.weights.interactions.share,
            save: Params.weights.interactions.save,
        }

        return weights[interactionType] || Params.weights.interactions.default
    }

    private isEmbeddingRecent(lastUpdated: Date): boolean {
        return Date.now() - lastUpdated.getTime() < Params.timeWindows.recentEmbeddingUpdate
    }

    private calculateActivenessFactor(interactions: UserInteraction[]): number {
        if (interactions.length === 0) return 0

        const recentCount = interactions.filter(
            (i) => Date.now() - i.timestamp.getTime() < Params.timeWindows.interactionHistory
        ).length

        return Math.min(recentCount / 100, 1)
    }

    private async collectUserData(userId: bigint): Promise<UserEmbeddingProps> {
        // Coleta todos os dados necessários para gerar um embedding
        const interactions = await this.interactionRepository.findByUserId(userId, 500)
        // Em uma implementação real, buscaríamos todos os outros dados necessários

        // Implementação simplificada para exemplo
        return {
            interactionHistory: interactions,
            viewingPatterns: [], // Obter de um serviço real
            contentPreferences: [], // Obter de um serviço real
        }
    }

    private generateEmbeddingMetadata(
        userData: UserEmbeddingProps,
        embedding: number[]
    ): Record<string, any> {
        // Gera metadados para o embedding
        const dominantInterests = this.extractDominantInterests(userData, embedding)
        const activenessFactor = this.calculateActivenessFactor(userData.interactionHistory)

        return {
            dominantInterests,
            activenessFactor,
            embedDimensions: {
                interactionDim: Params.timeWindows.interactionHistory,
                contentPrefDim: Params.dimensions.contentPreferences,
                socialDim: Params.dimensions.socialFeatures,
            },
            lastCalculated: new Date().toISOString(),
        }
    }

    private extractDominantInterests(userData: UserEmbeddingProps, embedding: number[]): string[] {
        // Em uma implementação real, analisaríamos o embedding para extrair interesses dominantes
        // Implementação simplificada: retorna as preferências de conteúdo do usuário
        return userData.contentPreferences?.slice(0, 5) || []
    }

    private async generateInteractionEmbedding(interactionFeatures: any): Promise<number[]> {
        // Gera um embedding para uma interação específica
        // Na implementação real, isso usaria um modelo específico para interações

        // Implementação simplificada: normaliza e redimensiona
        const featureVector: number[] = Object.values(interactionFeatures).filter(
            (val) => typeof val === "number"
        ) as number[]

        const resized = resizeVector(featureVector, this.dimension)
        return normalizeL2(resized)
    }

    private extractInteractionFeatures(interaction: UserInteraction): Record<string, any> {
        // Extrai características relevantes de uma interação
        const features: Record<string, any> = {
            interactionType: interaction.type,
            // Poderia ter mais informações como tempo gasto, completude, etc.
        }

        // Adicionar outros dados se disponíveis no metadata
        if (interaction.metadata) {
            Object.entries(interaction.metadata).forEach(([key, value]) => {
                features[`meta_${key}`] = value
            })
        }

        return features
    }

    /**
     * Gera um novo embedding para o usuário
     */
    public async generateUserEmbedding(userId: bigint): Promise<UserEmbeddingType> {
        try {
            this.logger.info(`Gerando embedding para usuário ${userId}`)

            // 1. Buscar interações recentes do usuário
            const interactions = await InteractionEvent.findAll({
                where: {
                    userId: userId.toString(),
                    entityType: "post",
                    type: {
                        [Op.in]: [
                            "like",
                            "share",
                            "comment",
                            "long_view",
                            "dislike",
                            "report",
                            "click",
                            "save",
                        ],
                    },
                },
                order: [["timestamp", "DESC"]],
                limit: 100,
            })

            // 2. Gerar embedding (em produção, usaria um modelo real)
            const vector = this.generateDummyUserEmbedding(interactions)

            // 3. Persistir o embedding
            await this.saveUserEmbedding(userId, vector)

            // 4. Buscar o embedding salvo e retornar convertido
            const savedEmbedding = await UserEmbedding.findOne({
                where: { userId: userId.toString() },
            })

            if (!savedEmbedding) {
                throw new Error(`Erro ao recuperar embedding recém-salvo para usuário ${userId}`)
            }

            // 5. Retornar usando o método de conversão
            return savedEmbedding.toUserEmbeddingType()
        } catch (error: any) {
            this.logger.error(`Erro ao gerar embedding para usuário ${userId}: ${error.message}`)

            // Em caso de erro, retornar um embedding neutro (formato UserEmbeddingType)
            const now = new Date()

            return {
                userId: userId.toString(),
                vector: {
                    dimension: this.dimension,
                    values: new Array(this.dimension).fill(0),
                    createdAt: now,
                    updatedAt: now,
                },
                metadata: {
                    source: "default",
                    error: error.message,
                },
            }
        }
    }

    /**
     * Salva o embedding de um usuário no banco de dados
     * @param userId ID do usuário
     * @param vector Vetor de embedding
     */
    private async saveUserEmbedding(userId: bigint, vector: number[]): Promise<void> {
        try {
            const existingEmbedding = await UserEmbedding.findOne({
                where: { userId: userId.toString() },
            })

            const vectorData = JSON.stringify({
                values: vector,
                dimension: this.dimension,
            })

            if (existingEmbedding) {
                await existingEmbedding.update({
                    vector: vectorData,
                    metadata: {
                        source: "interaction_based",
                        modelVersion: "0.1",
                        lastUpdated: new Date().toISOString(),
                    },
                })
            } else {
                await UserEmbedding.create({
                    userId: userId.toString(),
                    vector: vectorData,
                    dimension: this.dimension,
                    metadata: {
                        source: "interaction_based",
                        modelVersion: "0.1",
                    },
                })
            }
        } catch (error: any) {
            this.logger.error(`Erro ao salvar embedding do usuário ${userId}: ${error.message}`)
        }
    }

    /**
     * Gera um embedding simulado baseado em interações do usuário
     * Em produção, seria substituído por um modelo de ML real
     */
    private generateDummyUserEmbedding(interactions: InteractionEvent[]): number[] {
        try {
            // Inicializar um vetor de zeros
            const vector = new Array(this.dimension).fill(0)

            // Para simulação, vamos criar um vetor que reflete as interações
            const interactionWeights: Record<string, number> = {
                like: 1.0,
                share: 1.5,
                comment: 1.2,
                long_view: 0.8,
                click: 0.5,
                save: 1.3,
                dislike: -1.0,
                report: -1.5,
                skip: -0.3,
                short_view: 0.2,
            }

            // Sementes para garantir que o mesmo userId gere o mesmo vector base
            const userIdNumber = Number(BigInt(interactions[0]?.userId || "0") % BigInt(1000))

            // Gerar vetor de base usando userId como semente
            for (let i = 0; i < this.dimension; i++) {
                // Valor base aleatório mas determinístico para este usuário
                vector[i] = Math.sin(i * (userIdNumber + 1)) * 0.5
            }

            // Modificar o vetor base usando as interações
            for (const interaction of interactions) {
                // Obter entityId como número para usar como índice
                const entityIdBase = Number(BigInt(interaction.entityId) % BigInt(this.dimension))
                const weight = interactionWeights[interaction.type] || 0

                // Ajustar alguns elementos do vetor baseados na interação
                for (let offset = 0; offset < 5; offset++) {
                    const idx = (entityIdBase + offset) % this.dimension
                    vector[idx] += weight * 0.8 ** offset * 0.2
                }
            }

            // Normalizar o vetor
            const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
            if (norm > 0) {
                for (let i = 0; i < this.dimension; i++) {
                    vector[i] /= norm
                }
            }

            return vector
        } catch (error) {
            this.logger.error("Erro ao gerar embedding simulado")
            return new Array(this.dimension).fill(0)
        }
    }

    /**
     * Atualiza embeddings de usuários em massa (para uso em jobs programados)
     */
    public async updateUserEmbeddings(limit: number = 100): Promise<number> {
        try {
            // Obter usuários com embeddings mais antigos
            const embeddings = await UserEmbedding.findAll({
                order: [["updatedAt", "ASC"]],
                limit,
            })

            let updatedCount = 0
            for (const embedding of embeddings) {
                await this.generateUserEmbedding(BigInt(embedding.userId))
                updatedCount++
            }

            return updatedCount
        } catch (error: any) {
            this.logger.error(`Erro ao atualizar embeddings em massa: ${error.message}`)
            return 0
        }
    }
}
