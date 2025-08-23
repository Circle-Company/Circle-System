import { beforeEach, describe, expect, it, vi } from "vitest"
import { FeedbackProcessor } from "./FeedbackProcessor"
import { UserEmbeddingService } from "../embeddings/UserEmbeddingService"
import { PostEmbeddingService } from "../embeddings/PostEmbeddingService"
import { InteractionType, UserInteraction } from "../types"
import { Logger } from "../utils/logger"

// Mock dos serviços
vi.mock("../../swipe-engine/core/embeddings/UserEmbeddingService")
vi.mock("../../swipe-engine/core/embeddings/PostEmbeddingService")
vi.mock("../../swipe-engine/core/utils/logger")

describe("FeedbackProcessor", () => {
    let feedbackProcessor: FeedbackProcessor
    let mockUserEmbeddingService: any
    let mockPostEmbeddingService: any
    let mockLogger: any

    beforeEach(() => {
        // Resetar todos os mocks
        vi.clearAllMocks()

        // Configurar mocks
        mockUserEmbeddingService = {
            getUserEmbedding: vi.fn(),
            updateEmbedding: vi.fn(),
        }

        mockPostEmbeddingService = {
            getPostEmbedding: vi.fn(),
            updateEmbedding: vi.fn(),
            findSimilarPosts: vi.fn(),
        }

        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
        }

        // Criar instância do FeedbackProcessor com mocks
        feedbackProcessor = new FeedbackProcessor(
            mockUserEmbeddingService as unknown as UserEmbeddingService,
            mockPostEmbeddingService as unknown as PostEmbeddingService,
            mockLogger as unknown as Logger,
            2 // batchSize pequeno para testes
        )
    })

    describe("processInteraction", () => {
        const mockInteraction: UserInteraction = {
            id: "1",
            userId: BigInt(123),
            entityId: BigInt(456),
            entityType: "post",
            type: "like" as InteractionType,
            timestamp: new Date(),
            metadata: {
                engagementTime: 30,
                percentWatched: 100
            }
        }

        it("deve processar uma interação com sucesso", async () => {
            const result = await feedbackProcessor.processInteraction(mockInteraction)
            expect(result).toBe(true)
        })

        it("deve processar interações de alta prioridade imediatamente", async () => {
            mockUserEmbeddingService.getUserEmbedding.mockResolvedValue({
                vector: { values: [0.1, 0.2, 0.3] }
            })
            mockPostEmbeddingService.getPostEmbedding.mockResolvedValue({
                vector: { values: [0.4, 0.5, 0.6] }
            })

            await feedbackProcessor.processInteraction(mockInteraction)

            expect(mockUserEmbeddingService.updateEmbedding).toHaveBeenCalled()
        })

        it("deve lidar com erros durante o processamento", async () => {
            mockUserEmbeddingService.getUserEmbedding.mockRejectedValue(new Error("Erro de teste"))

            const result = await feedbackProcessor.processInteraction(mockInteraction)

            expect(result).toBe(false)
            expect(mockLogger.error).toHaveBeenCalled()
        })
    })

    describe("processBatch", () => {
        const mockInteractions: UserInteraction[] = [
            {
                id: "1",
                userId: BigInt(123),
                entityId: BigInt(456),
                entityType: "post",
                type: "like" as InteractionType,
                timestamp: new Date(),
                metadata: {}
            },
            {
                id: "2",
                userId: BigInt(123),
                entityId: BigInt(789),
                entityType: "post",
                type: "view" as InteractionType,
                timestamp: new Date(),
                metadata: {}
            }
        ]

        it("deve processar um lote de interações com sucesso", async () => {
            mockUserEmbeddingService.getUserEmbedding.mockResolvedValue({
                vector: { values: [0.1, 0.2, 0.3] }
            })
            mockPostEmbeddingService.getPostEmbedding.mockResolvedValue({
                vector: { values: [0.4, 0.5, 0.6] }
            })

            const result = await feedbackProcessor.processBatch()

            expect(result).toBe(mockInteractions.length)
            expect(mockUserEmbeddingService.updateEmbedding).toHaveBeenCalled()
        })

        it("deve retornar 0 para lote vazio", async () => {
            const result = await feedbackProcessor.processBatch()
            expect(result).toBe(0)
        })

        it("deve lidar com erros durante o processamento em lote", async () => {
            mockUserEmbeddingService.getUserEmbedding.mockRejectedValue(new Error("Erro de teste"))

            const result = await feedbackProcessor.processBatch()

            expect(result).toBe(0)
            expect(mockLogger.error).toHaveBeenCalled()
        })
    })
}) 