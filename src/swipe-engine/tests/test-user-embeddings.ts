import * as fs from "fs"
import * as path from "path"

import { InteractionType, UserInteraction } from "../core/types"
import { mockUserEmbeddings, mockUserInteractions, mockUsers } from "../data/mock-users"

import { UserEmbeddingService } from "../core/embeddings/UserEmbeddingService"
import { getLogger } from "../core/utils/logger"
import { v4 as uuidv4 } from "uuid"

const logger = getLogger("test-user-embeddings")

interface TestResults {
    timestamp: string
    users: Array<{
        userId: string
        username: string
        generatedEmbedding: {
            vector: number[]
            metadata?: Record<string, any>
        }
        currentEmbedding: {
            vector: number[]
            metadata?: Record<string, any>
        } | null
    }>
    updateResult?: {
        userId: string
        updatedCount: number
        finalEmbedding: {
            vector: number[]
            metadata?: Record<string, any>
        }
    }
}

export async function testUserEmbeddings() {
    try {
        // Estrutura para armazenar os resultados
        const testResults: TestResults = {
            timestamp: new Date().toISOString(),
            users: []
        }

        // Inicializar o serviço de embedding de usuários
        logger.info("Inicializando serviço de embedding de usuários...")
        const userEmbeddingService = new UserEmbeddingService(
            128, // dimensão do vetor de embedding
            "models/user_embedding_model",
            {
                // Mock do repositório de interações
                findByUserId: async (userId, limit) => {
                    const userInteractionData = mockUserInteractions.find(
                        ui => ui.userId === userId.toString()
                    )
                    
                    return userInteractionData?.interactionHistory.map(i => ({
                        id: uuidv4(),
                        userId: BigInt(userId),
                        entityId: BigInt(i.contentId),
                        entityType: "post",
                        type: i.type as InteractionType,
                        timestamp: i.timestamp,
                        metadata: {
                            duration: i.duration
                        }
                    })) || []
                }
            },
            {
                // Mock do repositório de embeddings
                findByUserId: async (userId) => {
                    const userEmbedding = mockUserEmbeddings.find(
                        ue => ue.userId === userId.toString()
                    )
                    if (!userEmbedding) return null

                    return {
                        userId: BigInt(userId),
                        embedding: userEmbedding.vector.values,
                        lastUpdated: new Date(),
                        version: 1,
                        metadata: userEmbedding.metadata
                    }
                },
                saveOrUpdate: async (data) => {
                    logger.info(`Atualizando embedding para usuário ${data.userId}`)
                }
            }
        )

        // Testar geração de embeddings para cada usuário mock
        logger.info("\nTestando geração de embeddings para usuários...")
        for (const user of mockUsers) {
            logger.info(`\nProcessando usuário: ${user.username} (ID: ${user.id})`)
            
            // Gerar embedding para o usuário
            const userEmbedding = await userEmbeddingService.generateUserEmbedding(BigInt(user.id))
            
            logger.info("Embedding gerado com sucesso:")
            logger.info(`Usuário: ${user.id}`)
            logger.info(`Metadata: ${JSON.stringify(userEmbedding.metadata)}`)

            // Buscar embedding atual do usuário
            const currentEmbedding = await userEmbeddingService.getUserEmbedding(BigInt(user.id))
            
            // Armazenar resultados do usuário
            const userResult = {
                userId: user.id,
                username: user.username,
                generatedEmbedding: {
                    vector: userEmbedding.vector.values,
                    metadata: userEmbedding.metadata
                },
                currentEmbedding: currentEmbedding ? {
                    vector: currentEmbedding.vector.values,
                    metadata: currentEmbedding.metadata
                } : null
            }
            testResults.users.push(userResult)

            if (currentEmbedding) {
                logger.info("\nEmbedding atual:")
                logger.info(`Vector: ${currentEmbedding.vector.values.length} dimensões`)
                logger.info(`Metadata: ${JSON.stringify(currentEmbedding.metadata)}`)
            }
        }

        // Testar atualização de embeddings
        logger.info("\nTestando atualização de embeddings...")
        const testUserId = BigInt(mockUsers[0].id)
        
        // Processar a atualização dos embeddings
        const updatedCount = await userEmbeddingService.updateUserEmbeddings(1)
        logger.info(`Embeddings atualizados: ${updatedCount}`)

        // Verificar o estado final do embedding
        const finalEmbedding = await userEmbeddingService.getUserEmbedding(testUserId)
        if (finalEmbedding) {
            logger.info("\nEstado final do embedding:")
            logger.info(`Vector: ${finalEmbedding.vector.values.length} dimensões`)
            logger.info(`Metadata: ${JSON.stringify(finalEmbedding.metadata)}`)

            // Adicionar resultado da atualização
            testResults.updateResult = {
                userId: testUserId.toString(),
                updatedCount,
                finalEmbedding: {
                    vector: finalEmbedding.vector.values,
                    metadata: finalEmbedding.metadata
                }
            }
        }

        // Salvar resultados em arquivo JSON
        const resultsDir = path.join(__dirname, "../../../results")
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true })
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const resultsPath = path.join(resultsDir, `user-embeddings-test-${timestamp}.json`)
        
        fs.writeFileSync(
            resultsPath,
            JSON.stringify(testResults, null, 2),
            "utf-8"
        )
        
        logger.info(`\nResultados salvos em: ${resultsPath}`)

    } catch (error) {
        logger.error("Erro durante o teste:", error)
        throw error
    }
}

// Executar o teste
testUserEmbeddings()
    .then(() => {
        logger.info("Teste de embeddings de usuários concluído com sucesso!")
        process.exit(0)
    })
    .catch((error) => {
        logger.error("Erro fatal durante o teste:", error)
        process.exit(1)
    }) 