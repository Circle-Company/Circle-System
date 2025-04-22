/**
 * Serviço de embedding para usuários
 */

import {
    UserDemographics,
    UserEmbedding,
    UserEmbeddingProps,
    UserInteraction,
    ViewMetrics,
} from "../types"
import { getLogger } from "../utils/logger"
import { normalizeL2 } from "../utils/normalization"
import { resizeVector } from "../utils/vector-operations"
import { BaseEmbeddingService } from "./BaseEmbeddingService"

// Definição das interfaces para repositórios
export interface IUserRepository {
    findById(userId: bigint): Promise<any>
    // outros métodos do repositório
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
    private userRepository: IUserRepository
    private interactionRepository: IInteractionRepository
    private userEmbeddingRepository: IUserEmbeddingRepository
    private readonly logger = getLogger("UserEmbeddingService")

    constructor(
        dimension: number = 128,
        modelPath: string = "models/user_embedding_model",
        userRepository: IUserRepository,
        interactionRepository: IInteractionRepository,
        userEmbeddingRepository: IUserEmbeddingRepository
    ) {
        super(dimension, modelPath)
        this.userRepository = userRepository
        this.interactionRepository = interactionRepository
        this.userEmbeddingRepository = userEmbeddingRepository
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
    async getUserEmbedding(userId: bigint): Promise<UserEmbedding> {
        try {
            // 1. Tentar recuperar embedding existente
            const storedEmbedding = await this.userEmbeddingRepository.findByUserId(userId)

            // 2. Se existir e for recente (menos de X dias), retornar
            if (storedEmbedding && this.isEmbeddingRecent(storedEmbedding.lastUpdated)) {
                return {
                    userId: String(userId),
                    vector: this.createEmbeddingVector(storedEmbedding.embedding),
                    metadata: storedEmbedding.metadata,
                }
            }

            // 3. Se não existir ou for antigo, gerar um novo
            // 3.1 Buscar dados do usuário
            const userData = await this.collectUserData(userId)

            // 3.2 Gerar novo embedding
            const newEmbedding = await this.generateEmbedding(userData)

            // 3.3 Criar objeto de embedding
            const userEmbedding: UserEmbedding = {
                userId: String(userId),
                vector: this.createEmbeddingVector(newEmbedding),
                metadata: this.generateEmbeddingMetadata(userData, newEmbedding),
            }

            // 3.4 Persistir o novo embedding
            await this.userEmbeddingRepository.saveOrUpdate({
                userId,
                embedding: newEmbedding,
                lastUpdated: new Date(),
                version: storedEmbedding ? storedEmbedding.version + 1 : 1,
                metadata: userEmbedding.metadata,
            })

            return userEmbedding
        } catch (error: any) {
            this.logger.error(`Erro ao obter embedding do usuário ${userId}: ${error.message}`)
            throw new Error(`Falha ao obter embedding do usuário: ${error.message}`)
        }
    }

    // Métodos auxiliares

    private processInteractionHistory(interactions: UserInteraction[]): number[] {
        // Processamento do histórico de interações para extração de características
        // Em uma implementação real, isso incluiria análise de interações por tipo,
        // ponderação por recência, etc.

        // Implementação simplificada para exemplo
        const result = new Array(50).fill(0)

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
        // Processamento das preferências de conteúdo para extração de características
        // Em uma implementação real, isso envolveria transformação de categorias em one-hot encoding
        // ou uso de embeddings pré-treinados para categorias

        // Implementação simplificada
        const result = new Array(20).fill(0)

        // Mapeamento fictício de preferências para índices
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
            // ... outros mapeamentos
        }

        preferences.forEach((pref) => {
            const index = preferenceMap[pref.toLowerCase()]
            if (index !== undefined && index < result.length) {
                result[index] = 1.0
            }
        })

        return result
    }

    private processDemographicInfo(demographics: UserDemographics): number[] {
        // Processamento das informações demográficas para extração de características
        // Implementação simplificada
        const result = new Array(10).fill(0)

        // Processamento de idade
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
                result[0] = ageIndex / 5 // Normaliza para 0-1
            }
        }

        // Outros processamentos demográficos seriam feitos aqui

        return result
    }

    private getInteractionWeight(interactionType: string): number {
        // Diferentes tipos de interação têm pesos diferentes
        const weights: Record<string, number> = {
            view: 0.1,
            like: 0.3,
            comment: 0.5,
            share: 0.7,
            save: 0.6,
        }

        return weights[interactionType] || 0.2 // Peso padrão se o tipo não for conhecido
    }

    private isEmbeddingRecent(lastUpdated: Date): boolean {
        // Consideramos um embedding recente se foi atualizado nos últimos 7 dias
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
        return Date.now() - lastUpdated.getTime() < ONE_WEEK
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
                interactionDim: 50,
                contentPrefDim: 20,
                socialDim: 30,
            },
            lastCalculated: new Date().toISOString(),
        }
    }

    private extractDominantInterests(userData: UserEmbeddingProps, embedding: number[]): string[] {
        // Em uma implementação real, analisaríamos o embedding para extrair interesses dominantes
        // Implementação simplificada: retorna as preferências de conteúdo do usuário
        return userData.contentPreferences?.slice(0, 5) || []
    }

    private calculateActivenessFactor(interactions: UserInteraction[]): number {
        if (interactions.length === 0) return 0

        // Contagem de interações nos últimos 30 dias
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
        const now = Date.now()
        const recentCount = interactions.filter(
            (i) => now - i.timestamp.getTime() < THIRTY_DAYS
        ).length

        // Máximo arbitrário de 100 interações para valor máximo
        return Math.min(recentCount / 100, 1)
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
}
