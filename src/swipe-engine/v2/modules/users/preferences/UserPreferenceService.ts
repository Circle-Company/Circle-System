/**
 * UserPreferenceService
 *
 * Serviço para gerenciar preferências de usuários, extraindo-as de interações
 * e permitindo acesso e atualização.
 */

import { UserInteraction, UserProfile } from "../../../core/types"

// Interface para repositório de preferências
export interface IPreferenceRepository {
    findByUserId(userId: bigint): Promise<UserPreferences | null>
    saveOrUpdate(preferences: UserPreferences): Promise<void>
}

// Interface para repositório de interações
export interface IInteractionLog {
    getRecentInteractions(userId: bigint, limit?: number): Promise<UserInteraction[]>
}

// Modelo de preferências de usuário
export interface UserPreferences {
    userId: bigint
    topics: {
        name: string
        weight: number
        lastUpdated: Date
    }[]
    contentTypes: {
        type: string
        weight: number
    }[]
    explicitPreferences: Record<string, any>
    lastUpdated: Date
}

export class UserPreferenceService {
    private preferenceRepository: IPreferenceRepository
    private interactionLog: IInteractionLog

    // Mapeamento de tipos de interação para pesos
    private readonly interactionWeights: Record<string, number> = {
        view: 0.1,
        like: 0.5,
        comment: 0.7,
        share: 0.8,
        save: 0.9,
        dislike: -0.5,
        report: -0.8,
    }

    // Decaimento das preferências ao longo do tempo (meia-vida em dias)
    private readonly preferenceHalfLifeDays: number = 30

    constructor(preferenceRepository: IPreferenceRepository, interactionLog: IInteractionLog) {
        this.preferenceRepository = preferenceRepository
        this.interactionLog = interactionLog
    }

    /**
     * Obtém as preferências atuais do usuário
     *
     * @param userId ID do usuário
     * @returns Preferências do usuário
     */
    public async getUserPreferences(userId: bigint): Promise<UserPreferences> {
        try {
            // Verificar se já temos preferências armazenadas
            const storedPreferences = await this.preferenceRepository.findByUserId(userId)

            if (storedPreferences) {
                // Verificar idade das preferências
                const daysSinceUpdate = this.getDaysSince(storedPreferences.lastUpdated)

                // Se atualizado nos últimos 3 dias, retornar diretamente
                if (daysSinceUpdate < 3) {
                    return storedPreferences
                }

                // Caso contrário, aplicar decaimento temporal
                return this.applyTemporalDecay(storedPreferences)
            }

            // Se não temos preferências armazenadas, extrair das interações
            return await this.extractPreferencesFromInteractions(userId)
        } catch (error: any) {
            console.error(`Erro ao obter preferências do usuário ${userId}: ${error.message}`)

            // Retornar preferências vazias em caso de erro
            return {
                userId,
                topics: [],
                contentTypes: [],
                explicitPreferences: {},
                lastUpdated: new Date(),
            }
        }
    }

    /**
     * Atualiza explicitamente as preferências do usuário
     *
     * @param userId ID do usuário
     * @param preferences Preferências explícitas
     */
    public async updateExplicitPreferences(
        userId: bigint,
        preferences: Record<string, any>
    ): Promise<void> {
        try {
            const currentPreferences = await this.getUserPreferences(userId)

            currentPreferences.explicitPreferences = {
                ...currentPreferences.explicitPreferences,
                ...preferences,
            }
            currentPreferences.lastUpdated = new Date()

            await this.preferenceRepository.saveOrUpdate(currentPreferences)
        } catch (error: any) {
            console.error(`Erro ao atualizar preferências do usuário ${userId}: ${error.message}`)
            throw new Error(`Falha ao atualizar preferências: ${error.message}`)
        }
    }

    /**
     * Converte preferências para o formato UserProfile do SwipeEngine
     *
     * @param preferences Preferências do usuário
     * @returns Perfil do usuário no formato esperado pelo SwipeEngine
     */
    public convertToUserProfile(preferences: UserPreferences): UserProfile {
        // Extrair os N tópicos com maior peso
        const interests = preferences.topics
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 10)
            .map((topic) => topic.name)

        return {
            userId: String(preferences.userId),
            interests,
            preferences: preferences.explicitPreferences,
        }
    }

    // Métodos privados auxiliares

    private async extractPreferencesFromInteractions(userId: bigint): Promise<UserPreferences> {
        // Buscar interações recentes
        const interactions = await this.interactionLog.getRecentInteractions(userId, 500)

        // Mapa para acumular pesos por tópico
        const topicWeights: Map<
            string,
            {
                weight: number
                lastUpdated: Date
            }
        > = new Map()

        // Mapa para acumular pesos por tipo de conteúdo
        const contentTypeWeights: Map<string, number> = new Map()

        // Processar cada interação
        interactions.forEach((interaction) => {
            // Extrair tópicos da metadata (se disponível)
            const topics = interaction.metadata?.topics || []
            const contentType = interaction.metadata?.contentType || "unknown"
            const interactionWeight = this.interactionWeights[interaction.type] || 0.1

            // Atualizar pesos dos tópicos
            topics.forEach((topic: string) => {
                const current = topicWeights.get(topic) || { weight: 0, lastUpdated: new Date(0) }

                topicWeights.set(topic, {
                    weight: current.weight + interactionWeight,
                    lastUpdated:
                        interaction.timestamp > current.lastUpdated
                            ? interaction.timestamp
                            : current.lastUpdated,
                })
            })

            // Atualizar peso do tipo de conteúdo
            const currentContentWeight = contentTypeWeights.get(contentType) || 0
            contentTypeWeights.set(contentType, currentContentWeight + interactionWeight)
        })

        // Construir objeto de preferências
        const userPreferences: UserPreferences = {
            userId,
            topics: Array.from(topicWeights.entries()).map(([name, data]) => ({
                name,
                weight: data.weight,
                lastUpdated: data.lastUpdated,
            })),
            contentTypes: Array.from(contentTypeWeights.entries()).map(([type, weight]) => ({
                type,
                weight,
            })),
            explicitPreferences: {},
            lastUpdated: new Date(),
        }

        // Normalizar pesos
        this.normalizeWeights(userPreferences)

        // Persistir preferências
        await this.preferenceRepository.saveOrUpdate(userPreferences)

        return userPreferences
    }

    private applyTemporalDecay(preferences: UserPreferences): UserPreferences {
        const now = new Date()
        const daysSinceUpdate = this.getDaysSince(preferences.lastUpdated)

        // Fator de decaimento exponencial
        const decayFactor = Math.pow(0.5, daysSinceUpdate / this.preferenceHalfLifeDays)

        // Aplicar decaimento a todos os tópicos
        preferences.topics.forEach((topic) => {
            const topicDaysSinceUpdate = this.getDaysSince(topic.lastUpdated)
            const topicDecayFactor = Math.pow(
                0.5,
                topicDaysSinceUpdate / this.preferenceHalfLifeDays
            )
            topic.weight *= topicDecayFactor
        })

        // Aplicar decaimento a todos os tipos de conteúdo
        preferences.contentTypes.forEach((contentType) => {
            contentType.weight *= decayFactor
        })

        // Atualizar timestamp
        preferences.lastUpdated = now

        return preferences
    }

    private normalizeWeights(preferences: UserPreferences): void {
        // Normalizar pesos dos tópicos
        if (preferences.topics.length > 0) {
            const totalTopicWeight = preferences.topics.reduce(
                (sum, topic) => sum + topic.weight,
                0
            )
            if (totalTopicWeight > 0) {
                preferences.topics.forEach((topic) => {
                    topic.weight = topic.weight / totalTopicWeight
                })
            }
        }

        // Normalizar pesos dos tipos de conteúdo
        if (preferences.contentTypes.length > 0) {
            const totalContentTypeWeight = preferences.contentTypes.reduce(
                (sum, type) => sum + type.weight,
                0
            )
            if (totalContentTypeWeight > 0) {
                preferences.contentTypes.forEach((contentType) => {
                    contentType.weight = contentType.weight / totalContentTypeWeight
                })
            }
        }
    }

    private getDaysSince(date: Date): number {
        const msPerDay = 24 * 60 * 60 * 1000
        return (Date.now() - date.getTime()) / msPerDay
    }
}
