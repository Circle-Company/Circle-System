import { beforeEach, describe, expect, it, vi } from "vitest"
import { InteractionType, Recommendation, RecommendationOptions, UserEmbedding as UserEmbeddingType, EmbeddingVector } from "../../types"
import { RecommendationCoordinator } from "../RecommendationCoordinator"
import { UserEmbeddingService } from "../../embeddings/UserEmbeddingService"
import { PostEmbeddingBuilder } from "../../embeddings/builders/PostEmbeddingBuilder"
import { RankingService } from "../RankingService"
import { RecommendationEngine } from "../RecommendationEngine"

// Mock dos modelos
vi.mock("../../../models/moments/moment-model", () => ({
    default: {
        findByPk: vi.fn(),
        findOne: vi.fn()
    }
}))

vi.mock("../../models/InteractionEvent", () => ({
    default: {
        create: vi.fn(),
        findAll: vi.fn()
    }
}))

vi.mock("../../models/PostCluster", () => ({
    default: {
        findAll: vi.fn(),
        findOne: vi.fn()
    }
}))

vi.mock("../../models/PostEmbedding", () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn()
    }
}))

vi.mock("../../models/UserClusterRank", () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
    }
}))

vi.mock("../../models/UserEmbedding", () => ({
    default: {
        findOne: vi.fn(),
        upsert: vi.fn()
    }
}))

// Mock do logger
vi.mock("../../utils/logger", () => ({
    getLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        error: vi.fn()
    })
}))

// Importar os modelos mockados
const Moment = vi.mocked(require("../../../models/moments/moment-model").default)
const InteractionEvent = vi.mocked(require("../../models/InteractionEvent").default)
const PostCluster = vi.mocked(require("../../models/PostCluster").default)
const PostEmbedding = vi.mocked(require("../../models/PostEmbedding").default)
const UserClusterRank = vi.mocked(require("../../models/UserClusterRank").default)
const UserEmbedding = vi.mocked(require("../../models/UserEmbedding").default)

describe("RecommendationCoordinator", () => {
    let coordinator: RecommendationCoordinator
    let mockUserEmbeddingService: UserEmbeddingService
    let mockPostEmbeddingBuilder: PostEmbeddingBuilder
    let mockRankingService: RankingService
    let mockRecommendationEngine: RecommendationEngine

    beforeEach(() => {
        // Limpar todos os mocks
        vi.clearAllMocks()

        // Criar instância do coordenador
        coordinator = new RecommendationCoordinator()

        // Acessar instâncias mockadas através da instância do coordenador
        mockUserEmbeddingService = (coordinator as any).userEmbeddingService
        mockPostEmbeddingBuilder = (coordinator as any).postEmbeddingBuilder
        mockRankingService = (coordinator as any).rankingService
        mockRecommendationEngine = (coordinator as any).engine
    })

    describe("getRecommendations", () => {
        it("deve gerar recomendações para um usuário existente", async () => {
            // Mock de recomendações
            const mockRecommendations: Recommendation[] = [
                {
                    entityId: BigInt(1),
                    entityType: "post",
                    score: 0.8,
                    timestamp: new Date(),
                    source: "recommendation_engine"
                }
            ]

            // Mock do comportamento do engine
            vi.spyOn(mockRecommendationEngine, "getRecommendations").mockResolvedValue(mockRecommendations)

            // Mock do embedding do usuário existente
            const mockVector: EmbeddingVector = {
                dimension: 3,
                values: [0.1, 0.2, 0.3],
                createdAt: new Date(),
                updatedAt: new Date()
            }

            const mockUserEmbedding: UserEmbeddingType = {
                userId: "123",
                vector: mockVector,
                metadata: {
                    source: "test",
                    modelVersion: "1.0"
                }
            }

            vi.mocked(UserEmbedding.findOne).mockResolvedValue({
                userId: "123",
                vector: JSON.stringify({ values: [0.1, 0.2, 0.3], dimension: 3 }),
                dimension: 3,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date()
            } as any)

            const result = await coordinator.getRecommendations("123")

            expect(result).toEqual(mockRecommendations)
            expect(mockRecommendationEngine.getRecommendations).toHaveBeenCalledWith(
                "123",
                20,
                expect.any(Object)
            )
        })

        it("deve criar embedding para usuário novo", async () => {
            // Mock de recomendações
            const mockRecommendations: Recommendation[] = []

            // Mock do comportamento do engine
            vi.spyOn(mockRecommendationEngine, "getRecommendations").mockResolvedValue(mockRecommendations)

            // Mock de usuário sem embedding
            vi.mocked(UserEmbedding.findOne).mockResolvedValue(null)

            // Mock da geração de embedding
            const mockVector: EmbeddingVector = {
                dimension: 3,
                values: [0.1, 0.2, 0.3],
                createdAt: new Date(),
                updatedAt: new Date()
            }

            const mockUserEmbedding: UserEmbeddingType = {
                userId: "123",
                vector: mockVector,
                metadata: {
                    source: "test",
                    modelVersion: "1.0"
                }
            }
            vi.spyOn(mockUserEmbeddingService, "generateUserEmbedding").mockResolvedValue(mockUserEmbedding)

            const result = await coordinator.getRecommendations("123")

            expect(result).toEqual(mockRecommendations)
            expect(mockUserEmbeddingService.generateUserEmbedding).toHaveBeenCalledWith("123")
        })

        it("deve lidar com erros graciosamente", async () => {
            // Mock de erro no engine
            vi.spyOn(mockRecommendationEngine, "getRecommendations").mockRejectedValue(new Error("Erro de teste"))

            const result = await coordinator.getRecommendations("123")

            expect(result).toEqual([])
        })
    })

    describe("processInteraction", () => {
        it("deve processar interação positiva e atualizar embedding", async () => {
            // Mock da criação de evento
            vi.mocked(InteractionEvent.create).mockResolvedValue({} as any)

            // Mock da atualização de embedding
            const mockVector: EmbeddingVector = {
                dimension: 3,
                values: [0.1, 0.2, 0.3],
                createdAt: new Date(),
                updatedAt: new Date()
            }

            const mockUserEmbedding: UserEmbeddingType = {
                userId: "123",
                vector: mockVector,
                metadata: {
                    source: "test",
                    modelVersion: "1.0"
                }
            }
            vi.spyOn(mockUserEmbeddingService, "generateUserEmbedding").mockResolvedValue(mockUserEmbedding)

            await coordinator.processInteraction("123", "456", "like" as InteractionType)

            expect(InteractionEvent.create).toHaveBeenCalledWith({
                userId: "123",
                entityId: "456",
                entityType: "post",
                type: "like",
                timestamp: expect.any(Date),
                metadata: { duration: 30 }
            })

            expect(mockUserEmbeddingService.generateUserEmbedding).toHaveBeenCalledWith("123")
        })

        it("deve processar interação negativa e atualizar embedding", async () => {
            vi.mocked(InteractionEvent.create).mockResolvedValue({} as any)
            const mockVector: EmbeddingVector = {
                dimension: 3,
                values: [0.1, 0.2, 0.3],
                createdAt: new Date(),
                updatedAt: new Date()
            }

            const mockUserEmbedding: UserEmbeddingType = {
                userId: "123",
                vector: mockVector,
                metadata: {
                    source: "test",
                    modelVersion: "1.0"
                }
            }
            vi.spyOn(mockUserEmbeddingService, "generateUserEmbedding").mockResolvedValue(mockUserEmbedding)

            await coordinator.processInteraction("123", "456", "dislike" as InteractionType)

            expect(InteractionEvent.create).toHaveBeenCalled()
            expect(mockUserEmbeddingService.generateUserEmbedding).toHaveBeenCalled()
        })

        it("deve processar interação neutra sem atualizar embedding", async () => {
            vi.mocked(InteractionEvent.create).mockResolvedValue({} as any)
            const mockVector: EmbeddingVector = {
                dimension: 3,
                values: [0.1, 0.2, 0.3],
                createdAt: new Date(),
                updatedAt: new Date()
            }

            const mockUserEmbedding: UserEmbeddingType = {
                userId: "123",
                vector: mockVector,
                metadata: {
                    source: "test",
                    modelVersion: "1.0"
                }
            }
            vi.spyOn(mockUserEmbeddingService, "generateUserEmbedding").mockResolvedValue(mockUserEmbedding)

            await coordinator.processInteraction("123", "456", "long_view" as InteractionType)

            expect(InteractionEvent.create).toHaveBeenCalled()
            expect(mockUserEmbeddingService.generateUserEmbedding).not.toHaveBeenCalled()
        })

        it("deve lidar com erros no processamento de interação", async () => {
            vi.mocked(InteractionEvent.create).mockRejectedValue(new Error("Erro de teste"))

            await expect(coordinator.processInteraction("123", "456", "like" as InteractionType)).rejects.toThrow("Erro de teste")
        })
    })

    describe("processNewPost", () => {
        it("deve processar um novo post corretamente", async () => {
            // Mock dos dados do post
            const mockPost = {
                getDataValue: vi.fn((field) => {
                    switch (field) {
                        case "description": return "Teste de post"
                        case "user_id": return BigInt(123)
                        default: return null
                    }
                }),
                createdAt: new Date(),
                tags: [
                    { getDataValue: () => "tag1" },
                    { getDataValue: () => "tag2" }
                ]
            }

            vi.mocked(Moment.findByPk).mockResolvedValue(mockPost as any)
            vi.spyOn(mockPostEmbeddingBuilder, "build").mockResolvedValue({
                dimension: 3,
                values: [0.1, 0.2, 0.3],
                createdAt: new Date(),
                updatedAt: new Date()
            })

            // Mock do embedding do post
            vi.mocked(PostEmbedding.findOne).mockResolvedValue({
                toPostEmbeddingType: () => ({
                    postId: "456",
                    vector: {
                        values: [0.1, 0.2, 0.3],
                        dimension: 3
                    }
                })
            } as any)

            // Mock dos clusters
            vi.mocked(PostCluster.findAll).mockResolvedValue([
                {
                    id: "cluster1",
                    memberIds: [],
                    update: vi.fn(),
                    toClusterInfo: () => ({
                        centroid: {
                            values: [0.2, 0.3, 0.4]
                        }
                    })
                }
            ] as any)

            await coordinator.processNewPost("456")

            expect(Moment.findByPk).toHaveBeenCalledWith("456", expect.any(Object))
            expect(mockPostEmbeddingBuilder.build).toHaveBeenCalled()
            expect(PostCluster.findAll).toHaveBeenCalled()
        })

        it("deve lidar com post não encontrado", async () => {
            vi.mocked(Moment.findByPk).mockResolvedValue(null)

            await coordinator.processNewPost("456")

            expect(mockPostEmbeddingBuilder.build).not.toHaveBeenCalled()
        })

        it("deve lidar com erros no processamento do post", async () => {
            vi.mocked(Moment.findByPk).mockRejectedValue(new Error("Erro de teste"))

            await coordinator.processNewPost("456")

            expect(mockPostEmbeddingBuilder.build).not.toHaveBeenCalled()
        })
    })

    describe("updateUserClusterRanks", () => {
        it("deve atualizar rankings de cluster para interação positiva", async () => {
            // Mock dos clusters do post
            vi.mocked(PostCluster.findAll).mockResolvedValue([
                {
                    id: "cluster1",
                    memberIds: ["456"]
                }
            ] as any)

            // Mock do ranking existente
            vi.mocked(UserClusterRank.findOne).mockResolvedValue({
                update: vi.fn(),
                interactionScore: 0.3,
                matchScore: 0.4
            } as any)

            await (coordinator as any).updateUserClusterRanks("123", "456", "like" as InteractionType)

            expect(UserClusterRank.findOne).toHaveBeenCalledWith({
                where: {
                    userId: "123",
                    clusterId: "cluster1"
                }
            })

            expect(UserClusterRank.update).toHaveBeenCalled()
        })

        it("deve criar novo ranking para cluster sem ranking existente", async () => {
            vi.mocked(PostCluster.findAll).mockResolvedValue([
                {
                    id: "cluster1",
                    memberIds: ["456"]
                }
            ] as any)

            vi.mocked(UserClusterRank.findOne).mockResolvedValue(null)

            await (coordinator as any).updateUserClusterRanks("123", "456", "like" as InteractionType)

            expect(UserClusterRank.create).toHaveBeenCalledWith({
                userId: "123",
                clusterId: "cluster1",
                score: 0.3,
                similarity: 0.3,
                interactionScore: 0.3,
                matchScore: 0.3,
                isActive: true,
                lastInteractionDate: expect.any(Date)
            })
        })

        it("deve lidar com post sem clusters", async () => {
            vi.mocked(PostCluster.findAll).mockResolvedValue([])

            await (coordinator as any).updateUserClusterRanks("123", "456", "like" as InteractionType)

            expect(UserClusterRank.findOne).not.toHaveBeenCalled()
            expect(UserClusterRank.create).not.toHaveBeenCalled()
        })
    })
}) 