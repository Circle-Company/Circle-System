/**
 * UserEmbeddingBuilder
 *
 * Responsável por construir embeddings de usuário aproveitando o serviço existente
 * do SwipeEngine, adicionando funcionalidades específicas para o Circle.
 */

import {
    IInteractionRepository,
    IUserEmbeddingRepository,
    IUserRepository,
    UserEmbeddingService,
} from "../../../core/embeddings/UserEmbeddingService"
import { UserEmbedding, UserEmbeddingProps } from "../../../core/types"

export class UserEmbeddingBuilder {
    private userEmbeddingService: UserEmbeddingService
    private dimension: number

    /**
     * Constrói uma nova instância de UserEmbeddingBuilder
     *
     * @param userEmbeddingService Serviço de embedding do SwipeEngine
     * @param dimension Dimensão do embedding (padrão: 128)
     */
    constructor(userEmbeddingService: UserEmbeddingService, dimension: number = 128) {
        this.userEmbeddingService = userEmbeddingService
        this.dimension = dimension
    }

    /**
     * Constrói o embedding para um usuário específico
     *
     * @param userId ID do usuário
     * @param options Opções adicionais para construção do embedding
     * @returns Embedding do usuário
     */
    public async buildEmbedding(
        userId: bigint,
        options?: {
            forceRebuild?: boolean
            includeAdditionalData?: boolean
        }
    ): Promise<UserEmbedding> {
        try {
            const embedding = await this.userEmbeddingService.getUserEmbedding(userId)

            // Se forceRebuild está habilitado, recalculamos mesmo com embedding existente
            if (options?.forceRebuild) {
                const userData = await this.collectEnhancedUserData(
                    userId,
                    options.includeAdditionalData
                )
                const newEmbedding = await this.userEmbeddingService.generateEmbedding(userData)

                // Atualizar o embedding existente com os novos dados
                // Aqui, poderíamos implementar lógica adicional específica do Circle

                return {
                    userId: embedding.userId,
                    vector: {
                        dimension: this.dimension,
                        values: newEmbedding,
                        createdAt: embedding.vector.createdAt,
                        updatedAt: new Date(),
                    },
                    metadata: embedding.metadata,
                }
            }

            return embedding
        } catch (error: any) {
            console.error(`Erro ao construir embedding para usuário ${userId}: ${error.message}`)
            throw new Error(`Falha ao construir embedding do usuário: ${error.message}`)
        }
    }

    /**
     * Coleta dados avançados do usuário para construção de embedding
     *
     * @param userId ID do usuário
     * @param includeAdditionalData Se true, inclui dados adicionais como interações de rede social
     * @returns Dados do usuário para geração de embedding
     */
    private async collectEnhancedUserData(
        userId: bigint,
        includeAdditionalData: boolean = false
    ): Promise<UserEmbeddingProps> {
        // Aqui poderíamos implementar coleta de dados específica do Circle
        // que vai além do que o SwipeEngine coleta por padrão

        // Por enquanto, estamos retornando uma estrutura básica
        const userData: UserEmbeddingProps = {
            interactionHistory: [],
            viewingPatterns: [],
            contentPreferences: [],
        }

        // Lógica adicional específica do Circle poderia ser implementada aqui

        return userData
    }

    /**
     * Cria uma nova instância de UserEmbeddingBuilder com os repositórios padrão
     *
     * @param userRepository Repositório de usuários
     * @param interactionRepository Repositório de interações
     * @param userEmbeddingRepository Repositório de embeddings de usuário
     * @returns Nova instância de UserEmbeddingBuilder
     */
    public static createWithDefaultRepositories(
        userRepository: IUserRepository,
        interactionRepository: IInteractionRepository,
        userEmbeddingRepository: IUserEmbeddingRepository
    ): UserEmbeddingBuilder {
        const userEmbeddingService = new UserEmbeddingService(
            128,
            "models/user_embedding_model",
            userRepository,
            interactionRepository,
            userEmbeddingRepository
        )

        return new UserEmbeddingBuilder(userEmbeddingService)
    }
}
