/**
 * PersonalizedScoreCalculator
 *
 * Calcula scores personalizados para ordenação do feed com base
 * nas preferências do usuário e características do conteúdo.
 */

import { UserPreferences } from "../../users/preferences/UserPreferenceService"
import { PostCandidate } from "./PostRanker"

export class PersonalizedScoreCalculator {
    /**
     * Calcula um score baseado na correspondência entre tópicos do post
     * e as preferências do usuário
     *
     * @param userPreferences Preferências do usuário
     * @param post Post candidato a ser pontuado
     * @returns Score de relevância entre 0 e 1
     */
    public async calculateTopicBasedScore(
        userPreferences: UserPreferences,
        post: PostCandidate
    ): Promise<number> {
        if (!post.topics || post.topics.length === 0) {
            return 0.5 // Valor médio para posts sem tópicos
        }

        // Obter tópicos do usuário em um mapa para fácil acesso
        const userTopicsMap = new Map(
            userPreferences.topics.map((topic) => [topic.name, topic.weight])
        )

        // Calcular score baseado no match de tópicos
        let totalScore = 0
        let matchCount = 0

        for (const topic of post.topics) {
            if (userTopicsMap.has(topic)) {
                totalScore += userTopicsMap.get(topic) || 0
                matchCount++
            }
        }

        // Se não há matches, usar valor padrão baseado no tipo de conteúdo
        if (matchCount === 0) {
            return this.getScoreByContentType(post.contentType, userPreferences)
        }

        // Score médio dos tópicos que deram match
        const score = totalScore / matchCount

        // Ajustar o score com base em outros fatores
        return this.adjustScore(score, post, userPreferences)
    }

    /**
     * Calcula score com base em texto e contexto usando método alternativo
     * quando não há embedding disponível
     *
     * @param userId ID do usuário
     * @param post Post a ser ranqueado
     * @returns Score de relevância
     */
    public async calculateContextualScore(userId: bigint, post: PostCandidate): Promise<number> {
        // Este método poderia implementar abordagens alternativas
        // baseadas em regras de negócio específicas

        // Implementação simplificada
        return 0.5
    }

    /**
     * Ajusta o score baseado em fatores adicionais
     */
    private adjustScore(
        baseScore: number,
        post: PostCandidate,
        userPreferences: UserPreferences
    ): number {
        let finalScore = baseScore

        // Ajustar com base no tipo de conteúdo
        const contentTypePreference = userPreferences.contentTypes.find(
            (type) => type.type === post.contentType
        )

        if (contentTypePreference) {
            // Combinar scores: 70% baseado em tópicos, 30% baseado em tipo de conteúdo
            finalScore = finalScore * 0.7 + contentTypePreference.weight * 0.3
        }

        // Mais ajustes poderiam ser aplicados aqui

        return Math.min(1, Math.max(0, finalScore))
    }

    /**
     * Retorna um score padrão baseado no tipo de conteúdo
     */
    private getScoreByContentType(
        contentType: string | undefined,
        userPreferences: UserPreferences
    ): number {
        if (!contentType) {
            return 0.4 // Valor base para conteúdo sem tipo
        }

        // Procurar preferência pelo tipo de conteúdo
        const typePreference = userPreferences.contentTypes.find(
            (type) => type.type === contentType
        )

        if (typePreference) {
            return typePreference.weight
        }

        // Valores padrão para tipos comuns
        const defaultScores: Record<string, number> = {
            photo: 0.6,
            video: 0.55,
            text: 0.5,
            article: 0.45,
        }

        return defaultScores[contentType] || 0.4
    }
}
