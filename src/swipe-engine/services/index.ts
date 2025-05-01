/**
 * Sistema de Recomendação Circle - Ponto de entrada principal
 *
 * Este arquivo exporta o coordenador de recomendação e outras funções
 * auxiliares para uso na aplicação principal.
 */

import { RecommendationCoordinator } from "../core/recommendation/RecommendationCoordinator"
import { InteractionType, Recommendation, RecommendationOptions } from "../core/types"

// Instância singleton do coordenador
let coordinator: RecommendationCoordinator | null = null

/**
 * Inicializa o sistema de recomendação
 */
export function initializeRecommendationSystem(): void {
    coordinator = new RecommendationCoordinator()
}

/**
 * Obtém recomendações para um usuário
 *
 * @param userId ID do usuário
 * @param options Opções de configuração
 * @returns Lista de recomendações
 */
export async function getRecommendations(
    userId: string | bigint,
    options: RecommendationOptions = {}
): Promise<Recommendation[]> {
    ensureInitialized()
    return await coordinator!.getRecommendations(userId, options)
}

/**
 * Processa uma interação do usuário com conteúdo
 *
 * @param userId ID do usuário
 * @param entityId ID da entidade (post, usuário)
 * @param entityType Tipo da entidade
 * @param interactionType Tipo de interação
 * @param metadata Metadados adicionais
 */
export async function processInteraction(
    userId: string | bigint,
    entityId: string | bigint,
    entityType: "user" | "post",
    interactionType: InteractionType,
    metadata: Record<string, any> = {}
): Promise<void> {
    ensureInitialized()
    return await coordinator!.processInteraction(
        userId,
        entityId,
        entityType,
        interactionType,
        metadata
    )
}

/**
 * Processa um novo post para inclusão no sistema de recomendação
 *
 * @param postId ID do post
 */
export async function processNewPost(postId: string | bigint): Promise<void> {
    ensureInitialized()
    return await coordinator!.processNewPost(postId)
}

/**
 * Certifica-se de que o sistema está inicializado
 */
function ensureInitialized(): void {
    if (!coordinator) {
        initializeRecommendationSystem()
    }
}

// Exportar o coordenador para uso avançado
export { RecommendationCoordinator }
