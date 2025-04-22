/**
 * Exportação central dos serviços de embedding
 */

export * from "./BaseEmbeddingService"
export * from "./PostEmbeddingService"
export * from "./UserEmbeddingService"

// Exportação de fábrica para criar serviços de embedding
import {
    IPostEmbeddingRepository,
    IPostRepository,
    ITagRepository,
    PostEmbeddingService,
} from "./PostEmbeddingService"
import {
    IInteractionRepository,
    IUserEmbeddingRepository,
    IUserRepository,
    UserEmbeddingService,
} from "./UserEmbeddingService"

/**
 * Configuração para criar serviços de embedding
 */
export interface EmbeddingServiceConfig {
    embeddingDimension?: number
    modelPath?: {
        user?: string
        post?: string
    }
    repositories: {
        user?: IUserRepository
        interaction?: IInteractionRepository
        userEmbedding?: IUserEmbeddingRepository
        post?: IPostRepository
        postEmbedding?: IPostEmbeddingRepository
        tag?: ITagRepository
    }
}

/**
 * Cria um serviço de embedding de usuário
 * @param config Configuração do serviço
 * @returns Instância de UserEmbeddingService
 */
export function createUserEmbeddingService(config: EmbeddingServiceConfig): UserEmbeddingService {
    if (
        !config.repositories.user ||
        !config.repositories.interaction ||
        !config.repositories.userEmbedding
    ) {
        throw new Error("Repositórios necessários não fornecidos para UserEmbeddingService")
    }

    return new UserEmbeddingService(
        config.embeddingDimension || 128,
        config.modelPath?.user || "models/user_embedding_model",
        config.repositories.user,
        config.repositories.interaction,
        config.repositories.userEmbedding
    )
}

/**
 * Cria um serviço de embedding de post
 * @param config Configuração do serviço
 * @returns Instância de PostEmbeddingService
 */
export function createPostEmbeddingService(config: EmbeddingServiceConfig): PostEmbeddingService {
    if (
        !config.repositories.post ||
        !config.repositories.postEmbedding ||
        !config.repositories.tag
    ) {
        throw new Error("Repositórios necessários não fornecidos para PostEmbeddingService")
    }

    return new PostEmbeddingService(
        config.embeddingDimension || 128,
        config.modelPath?.post || "models/post_embedding_model",
        config.repositories.post,
        config.repositories.postEmbedding,
        config.repositories.tag
    )
}

/**
 * Interface que representa o conjunto de serviços de embedding do sistema
 */
export interface EmbeddingServices {
    userEmbeddingService: UserEmbeddingService
    postEmbeddingService: PostEmbeddingService
}

/**
 * Cria todos os serviços de embedding necessários para o sistema
 * @param config Configuração dos serviços
 * @returns Objeto com todas as instâncias de serviços de embedding
 */
export function createEmbeddingServices(config: EmbeddingServiceConfig): EmbeddingServices {
    return {
        userEmbeddingService: createUserEmbeddingService(config),
        postEmbeddingService: createPostEmbeddingService(config),
    }
}
