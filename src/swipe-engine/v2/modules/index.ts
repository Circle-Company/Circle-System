/**
 * Exportação central dos módulos do Circle
 *
 * Este arquivo facilita a importação dos principais componentes
 * da estrutura modular do sistema.
 */

// Exportações do módulo de usuários
import { UserClusterManager } from "./users/clustering/UserClusterManager"
import { UserEmbeddingBuilder } from "./users/embedding/UserEmbeddingBuilder"
import {
    IInteractionLog,
    IPreferenceRepository,
    UserPreferenceService,
    UserPreferences,
} from "./users/preferences/UserPreferenceService"

// Exportações do módulo de feed
import { DiversityConfig, DiversityEngine } from "./feed/diversity/DiversityEngine"
import { PersonalizedScoreCalculator } from "./feed/ranking/PersonalizedScoreCalculator"
import {
    IEmbeddingRepository,
    IPostRepository,
    PostCandidate,
    PostRanker,
    RankedPost,
} from "./feed/ranking/PostRanker"

// Re-exportações para uso externo
export {
    UserClusterManager,
    UserEmbeddingBuilder,
    UserPreferenceService,
    type IInteractionLog,
    type IPreferenceRepository,
    type UserPreferences,
}

export {
    DiversityEngine,
    PersonalizedScoreCalculator,
    PostRanker,
    type DiversityConfig,
    type IEmbeddingRepository,
    type IPostRepository,
    type PostCandidate,
    type RankedPost,
}

/**
 * Função para criar os principais serviços em uma única chamada
 * com configuração unificada
 */
export function createCircleServices(config: {
    repositories: {
        userRepository: any
        interactionRepository: any
        userEmbeddingRepository: any
        preferenceRepository: any
        postRepository: any
        embeddingRepository: any
    }
    options?: {
        rankingConfig?: any
        diversityConfig?: any
    }
}) {
    // Criar serviço de preferências
    const preferenceService = new UserPreferenceService(
        config.repositories.preferenceRepository,
        config.repositories.interactionRepository
    )

    // Criar builder de embedding de usuário
    const userEmbeddingBuilder = UserEmbeddingBuilder.createWithDefaultRepositories(
        config.repositories.userRepository,
        config.repositories.interactionRepository,
        config.repositories.userEmbeddingRepository
    )

    // Criar calculador de scores personalizados
    const scoreCalculator = new PersonalizedScoreCalculator()

    // Criar ranqueador de posts
    const postRanker = new PostRanker(
        config.repositories.postRepository,
        config.repositories.embeddingRepository,
        preferenceService,
        scoreCalculator,
        config.options?.rankingConfig
    )

    // Criar motor de diversidade
    const diversityEngine = new DiversityEngine(config.options?.diversityConfig)

    return {
        userEmbeddingBuilder,
        userPreferenceService: preferenceService,
        postRanker,
        diversityEngine,
        scoreCalculator,
    }
}
