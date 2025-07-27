import { beforeEach, describe, expect, it, vi } from "vitest"

import Comment from "../../models/comments/comment-model.js"
import CommentStatistic from "../../models/comments/comment_statistics-model.js"
import Follow from "../../models/user/follow-model"
import { InternalServerError } from "../../errors"
import Like from "../../models/moments/like-model"
import Moment from "../../models/moments/moment-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import User from "../../models/user/user-model"
import { populateMoment } from "../../helpers/populate-moments"
import { processInteraction } from "../../swipe-engine/services"
import { processResponseItems } from "./processResponseItems"

// Mock dos módulos
vi.mock("../../../helpers/populate-moments")
vi.mock("../../services")
vi.mock("../../../models/moments/moment-model")
vi.mock("../../../models/user/user-model")
vi.mock("../../../models/user/profilepicture-model")
vi.mock("../../../models/user/follow-model")
vi.mock("../../../models/moments/like-model")
vi.mock("../../../models/comments/comment-model.js")
vi.mock("../../../models/comments/comment_statistics-model.js")

describe("processResponseItems", () => {
    const mockUserId = "123"
    const mockMomentIds = ["456", "789"]
    const mockMomentId = BigInt("456")

    // Dados mockados para os testes
    const mockMomentData = {
        id: mockMomentId,
        description: "Teste momento",
        midia: {
            content_type: "image",
            nhd_resolution: "url_resolucao",
        },
        visible: true,
        deleted: false,
        blocked: false,
    }

    const mockUserData = {
        id: BigInt(mockUserId),
        username: "testuser",
        verifyed: true,
        profile_pictures: {
            fullhd_resolution: "url_fullhd",
            tiny_resolution: "url_tiny",
        },
    }

    const mockComments = [
        {
            id: 1,
            content: "Comentário 1",
            created_at: new Date(),
            user_id: BigInt("789"),
            statistics: { total_likes_num: 10 },
        },
        {
            id: 2,
            content: "Comentário 2",
            created_at: new Date(),
            user_id: BigInt("789"),
            statistics: { total_likes_num: 5 },
        },
    ]

    beforeEach(() => {
        // Resetar todos os mocks antes de cada teste
        vi.clearAllMocks()

        // Mock do populateMoment
        vi.mocked(populateMoment).mockResolvedValue(mockMomentData)

        // Mock do Moment.findOne (para buscar user_id)
        vi.mocked(Moment.findOne).mockResolvedValue({
            user_id: BigInt(mockUserId),
        } as any)

        // Mock do Follow.findOne
        vi.mocked(Follow.findOne).mockResolvedValue({
            user_id: BigInt(mockUserId),
            followed_user_id: BigInt(mockUserId),
        } as any)

        // Mock do Like.findOne
        vi.mocked(Like.findOne).mockResolvedValue({
            user_id: BigInt(mockUserId),
            liked_moment_id: mockMomentId,
        } as any)

        // Mock do User.findOne
        vi.mocked(User.findOne).mockResolvedValue(mockUserData as any)

        // Mock do Comment.findAndCountAll
        vi.mocked(Comment.findAndCountAll).mockResolvedValue({
            count: 2,
            rows: mockComments,
        } as any)

        // Mock do CommentStatistic.findOne
        vi.mocked(CommentStatistic.findOne).mockResolvedValue({
            total_likes_num: 10,
        } as any)

        // Mock do processInteraction
        vi.mocked(processInteraction).mockResolvedValue(undefined)
    })

    it("deve processar corretamente um momento com todos os dados", async () => {
        const result = await processResponseItems(mockMomentIds, mockUserId)

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({
            ...mockMomentData,
            user: {
                id: mockUserData.id,
                username: mockUserData.username,
                verifyed: mockUserData.verifyed,
                profile_picture: {
                    small_resolution: mockUserData.profile_pictures.fullhd_resolution,
                    tiny_resolution: mockUserData.profile_pictures.tiny_resolution,
                },
                you_follow: true,
            },
            comments: {
                count: 2,
                comments: expect.arrayContaining([
                    expect.objectContaining({
                        content: "Comentário 1",
                        statistics: { total_likes_num: 10 },
                    }),
                ]),
            },
            is_liked: true,
        })

        // Verificar se processInteraction foi chamado
        expect(processInteraction).toHaveBeenCalledWith(
            mockUserId,
            mockMomentIds[0],
            "short_view",
            { source: "feed" }
        )
    })

    it("deve lidar com erro ao buscar o dono do momento", async () => {
        vi.mocked(Moment.findOne).mockResolvedValue(null)

        const result = await processResponseItems(mockMomentIds, mockUserId)

        expect(result).toHaveLength(0)
        expect(processInteraction).not.toHaveBeenCalled()
    })

    it("deve lidar com erro ao processar um momento específico", async () => {
        vi.mocked(populateMoment).mockRejectedValueOnce(new Error("Erro ao popular momento"))

        const result = await processResponseItems(mockMomentIds, mockUserId)

        expect(result).toHaveLength(1) // Apenas o segundo momento deve ser processado
        expect(processInteraction).toHaveBeenCalledTimes(1)
    })

    it("deve lidar com erro silencioso no processInteraction", async () => {
        vi.mocked(processInteraction).mockRejectedValueOnce(new Error("Erro ao processar interação"))

        const result = await processResponseItems(mockMomentIds, mockUserId)

        expect(result).toHaveLength(2)
        // O erro no processInteraction não deve afetar o resultado
        expect(result[0]).toBeDefined()
    })

    it("deve ordenar comentários por número de likes", async () => {
        const result = await processResponseItems(mockMomentIds, mockUserId)

        expect(result).toBeDefined()
        expect(result[0]).toBeDefined()
        expect(result[0]?.comments?.comments).toHaveLength(2)
        expect(result[0]?.comments?.comments[0]?.statistics?.total_likes_num).toBeGreaterThan(
            result[0]?.comments?.comments[1]?.statistics?.total_likes_num ?? 0
        )
    })

    it("deve retornar array vazio quando todos os momentos falham", async () => {
        vi.mocked(populateMoment).mockRejectedValue(new Error("Erro ao popular momento"))

        const result = await processResponseItems(mockMomentIds, mockUserId)

        expect(result).toHaveLength(0)
        expect(processInteraction).not.toHaveBeenCalled()
    })
}) 