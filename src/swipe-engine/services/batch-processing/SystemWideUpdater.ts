/**
 * SystemWideUpdater
 *
 * Responsável por atualizar embeddings de usuários e posts de forma
 * sistemática e periódica, usado para manter os embeddings atualizados.
 */

import { PostEmbeddingService } from "../../core/embeddings/PostEmbeddingService"
import { UserEmbeddingService } from "../../core/embeddings/UserEmbeddingService"
import { getLogger } from "../../core/utils/logger"

/**
 * Configuração para o atualizador de sistema
 */
export interface SystemWideUpdaterConfig {
    // Tamanho do lote para processamento
    batchSize: number

    // Quantidade máxima de embeddings a processar por execução
    maxItemsPerRun: number
}

/**
 * Interface para repositório de IDs
 */
interface IdRepository {
    findAllIds(limit: number, offset: number): Promise<string[]>
}

/**
 * Responsável por atualizar embeddings em todo o sistema
 */
export class SystemWideUpdater {
    private readonly logger = getLogger("SystemWideUpdater")
    private config: SystemWideUpdaterConfig

    /**
     * Construtor do atualizador de sistema
     * @param config Configuração para o atualizador
     */
    constructor(config: Partial<SystemWideUpdaterConfig> = {}) {
        this.config = {
            batchSize: 100,
            maxItemsPerRun: 5000,
            ...config,
        }
    }

    /**
     * Atualiza embeddings de usuários em lotes
     * @param userEmbeddingService Serviço de embedding de usuário
     * @param batchSize Tamanho do lote (opcional)
     * @returns Número de embeddings atualizados
     */
    public async updateUserEmbeddings(
        userEmbeddingService: UserEmbeddingService,
        batchSize?: number
    ): Promise<number> {
        const effectiveBatchSize = batchSize || this.config.batchSize
        this.logger.info(
            `Iniciando atualização de embeddings de usuário em lotes de ${effectiveBatchSize}`
        )

        try {
            // Obter o repositório de usuários do serviço de embedding
            const userRepository = (userEmbeddingService as any).userRepository as IdRepository
            if (!userRepository || typeof userRepository.findAllIds !== "function") {
                throw new Error(
                    "Repositório de usuários não encontrado ou não tem método findAllIds"
                )
            }

            // Atualizar embeddings em lotes
            let offset = 0
            let totalProcessed = 0
            let hasMore = true

            while (hasMore && totalProcessed < this.config.maxItemsPerRun) {
                // Buscar lote de IDs de usuário
                const userIds = await userRepository.findAllIds(effectiveBatchSize, offset)

                if (userIds.length === 0) {
                    hasMore = false
                    break
                }

                // Processar cada usuário no lote
                const updatePromises = userIds.map(async (userId) => {
                    try {
                        await userEmbeddingService.getUserEmbedding(BigInt(userId))
                        return true
                    } catch (error) {
                        this.logger.error(
                            `Erro ao atualizar embedding para usuário ${userId}: ${error}`
                        )
                        return false
                    }
                })

                // Aguardar todas as atualizações do lote
                const results = await Promise.all(updatePromises)
                const successCount = results.filter(Boolean).length

                totalProcessed += userIds.length
                offset += userIds.length

                this.logger.info(
                    `Processado lote de ${userIds.length} usuários, ` +
                        `${successCount} embeddings atualizados com sucesso`
                )

                // Verificar se chegamos ao fim
                if (userIds.length < effectiveBatchSize) {
                    hasMore = false
                }
            }

            this.logger.info(
                `Atualização de embeddings de usuário concluída, ${totalProcessed} usuários processados`
            )
            return totalProcessed
        } catch (error: any) {
            this.logger.error(`Erro ao atualizar embeddings de usuário: ${error.message}`)
            throw error
        }
    }

    /**
     * Atualiza embeddings de posts em lotes
     * @param postEmbeddingService Serviço de embedding de post
     * @param batchSize Tamanho do lote (opcional)
     * @returns Número de embeddings atualizados
     */
    public async updatePostEmbeddings(
        postEmbeddingService: PostEmbeddingService,
        batchSize?: number
    ): Promise<number> {
        const effectiveBatchSize = batchSize || this.config.batchSize
        this.logger.info(
            `Iniciando atualização de embeddings de post em lotes de ${effectiveBatchSize}`
        )

        try {
            // Obter o repositório de posts do serviço de embedding
            const postRepository = (postEmbeddingService as any).postRepository as IdRepository
            if (!postRepository || typeof postRepository.findAllIds !== "function") {
                throw new Error("Repositório de posts não encontrado ou não tem método findAllIds")
            }

            // Atualizar embeddings em lotes
            let offset = 0
            let totalProcessed = 0
            let hasMore = true

            while (hasMore && totalProcessed < this.config.maxItemsPerRun) {
                // Buscar lote de IDs de post
                const postIds = await postRepository.findAllIds(effectiveBatchSize, offset)

                if (postIds.length === 0) {
                    hasMore = false
                    break
                }

                // Processar cada post no lote
                const updatePromises = postIds.map(async (postId) => {
                    try {
                        await postEmbeddingService.getPostEmbedding(BigInt(postId))
                        return true
                    } catch (error) {
                        this.logger.error(
                            `Erro ao atualizar embedding para post ${postId}: ${error}`
                        )
                        return false
                    }
                })

                // Aguardar todas as atualizações do lote
                const results = await Promise.all(updatePromises)
                const successCount = results.filter(Boolean).length

                totalProcessed += postIds.length
                offset += postIds.length

                this.logger.info(
                    `Processado lote de ${postIds.length} posts, ` +
                        `${successCount} embeddings atualizados com sucesso`
                )

                // Verificar se chegamos ao fim
                if (postIds.length < effectiveBatchSize) {
                    hasMore = false
                }
            }

            this.logger.info(
                `Atualização de embeddings de post concluída, ${totalProcessed} posts processados`
            )
            return totalProcessed
        } catch (error: any) {
            this.logger.error(`Erro ao atualizar embeddings de post: ${error.message}`)
            throw error
        }
    }

    /**
     * Atualiza embeddings de forma prioritária para entidades específicas
     * @param userEmbeddingService Serviço de embedding de usuário
     * @param postEmbeddingService Serviço de embedding de post
     * @param priorityUserIds IDs de usuários prioritários para atualização
     * @param priorityPostIds IDs de posts prioritários para atualização
     */
    public async updatePriorityEmbeddings(
        userEmbeddingService: UserEmbeddingService | null,
        postEmbeddingService: PostEmbeddingService | null,
        priorityUserIds: string[] = [],
        priorityPostIds: string[] = []
    ): Promise<void> {
        this.logger.info(
            `Iniciando atualização prioritária para ${priorityUserIds.length} usuários e ${priorityPostIds.length} posts`
        )

        // Atualizar embeddings de usuários prioritários
        if (userEmbeddingService && priorityUserIds.length > 0) {
            const userPromises = priorityUserIds.map(async (userId) => {
                try {
                    await userEmbeddingService.getUserEmbedding(BigInt(userId))
                    return true
                } catch (error) {
                    this.logger.error(
                        `Erro ao atualizar embedding prioritário para usuário ${userId}: ${error}`
                    )
                    return false
                }
            })

            const userResults = await Promise.all(userPromises)
            const successCount = userResults.filter(Boolean).length

            this.logger.info(
                `${successCount}/${priorityUserIds.length} embeddings de usuário prioritários atualizados`
            )
        }

        // Atualizar embeddings de posts prioritários
        if (postEmbeddingService && priorityPostIds.length > 0) {
            const postPromises = priorityPostIds.map(async (postId) => {
                try {
                    await postEmbeddingService.getPostEmbedding(BigInt(postId))
                    return true
                } catch (error) {
                    this.logger.error(
                        `Erro ao atualizar embedding prioritário para post ${postId}: ${error}`
                    )
                    return false
                }
            })

            const postResults = await Promise.all(postPromises)
            const successCount = postResults.filter(Boolean).length

            this.logger.info(
                `${successCount}/${priorityPostIds.length} embeddings de post prioritários atualizados`
            )
        }

        this.logger.info("Atualização prioritária concluída")
    }
}
