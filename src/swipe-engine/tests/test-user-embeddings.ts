import * as fs from "fs"
import * as path from "path"

import { InteractionType, UserEmbedding, UserInteraction } from "../core/types"
import { mockUserEmbeddings, mockUserInteractions, mockUsers } from "../data/mock-users"

import PostEmbeddingModel from "../models/PostEmbedding"
import UserEmbeddingModel from "../models/UserEmbedding"
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
        const userEmbeddingService = new UserEmbeddingService()

        // Testar geração de embeddings para cada usuário mock
        logger.info("\nTestando geração de embeddings para usuários...")
        for (const user of mockUsers) {
            logger.info(`\nProcessando usuário: ${user.username} (ID: ${user.id})`)
            
            // Gerar embedding para o usuário
            const userEmbedding = await userEmbeddingService.generateUserEmbedding(BigInt(user.id))
            
            logger.info("Embedding gerado com sucesso:")
            logger.info(`Usuário: ${user.id}`)
            logger.info(`Metadata: ${JSON.stringify(userEmbedding.metadata)}`)

            // Buscar embedding atual do usuário no banco
            const currentEmbeddingInstance = await UserEmbeddingModel.findOne({ where: { userId: user.id } })
            let currentEmbeddingData: UserEmbedding | null = null
            if (currentEmbeddingInstance) {
                currentEmbeddingData = currentEmbeddingInstance.toUserEmbeddingType()
            }

            // Armazenar resultados do usuário
            const userResult = {
                userId: user.id,
                username: user.username,
                generatedEmbedding: {
                    vector: userEmbedding.vector.values,
                    metadata: userEmbedding.metadata || {}
                },
                currentEmbedding: currentEmbeddingData ? {
                    vector: currentEmbeddingData.vector.values,
                    metadata: currentEmbeddingData.metadata || {}
                } : null
            }
            testResults.users.push(userResult)

            if (currentEmbeddingData) {
                logger.info("\nEmbedding atual:")
                logger.info(`Vector: ${currentEmbeddingData.vector.values.length} dimensões`)
                logger.info(`Metadata: ${JSON.stringify(currentEmbeddingData.metadata || {})}`)
            }

            // Salvar embedding gerado no banco
            await UserEmbeddingModel.upsert({
                userId: user.id,
                vector: JSON.stringify(userEmbedding.vector),
                dimension: userEmbedding.vector.dimension,
                metadata: userEmbedding.metadata || {}
            })
        }

        // Testar atualização de embeddings
        logger.info("\nTestando atualização de embeddings...")
        const testUserId = BigInt(mockUsers[0].id)
        // Processar a atualização dos embeddings
        await userEmbeddingService.updateUserEmbeddings(testUserId)
        logger.info(`Embeddings atualizados para usuário: ${testUserId}`)
        // Verificar o estado final do embedding
        const finalEmbeddingInstance = await UserEmbeddingModel.findOne({ where: { userId: testUserId.toString() } })
        let finalEmbeddingData: UserEmbedding | null = null
        if (finalEmbeddingInstance) {
            finalEmbeddingData = finalEmbeddingInstance.toUserEmbeddingType()
        }

        if (finalEmbeddingData) {
            logger.info("\nEstado final do embedding:")
            logger.info(`Vector: ${finalEmbeddingData.vector.values.length} dimensões`)
            logger.info(`Metadata: ${JSON.stringify(finalEmbeddingData.metadata || {})}`)
            // Adicionar resultado da atualização
            testResults.updateResult = {
                userId: testUserId.toString(),
                updatedCount: 1,
                finalEmbedding: {
                    vector: finalEmbeddingData.vector.values,
                    metadata: finalEmbeddingData.metadata || {}
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