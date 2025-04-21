import { beforeEach, describe, expect, it, vi } from "vitest"
import { search_mixer } from ".."
import { related_candidates } from "../../related_candidates"
import { unknown_candidates } from "../../unknown_candidates"
import { mix_lists } from "../mix_lists"
import { security_filter } from "../security_filter"

// Mock dos módulos dependentes
vi.mock("../../related_candidates")
vi.mock("../../unknown_candidates")
vi.mock("../security_filter")
vi.mock("../mix_lists")

describe("Search Mixer Module", () => {
    const relatedCandidatesMock = [
        {
            id: BigInt(1),
            username: "user1",
            score: 10,
            verifyed: false as const,
            you_follow: true,
            blocked: false,
            profile_picture: { tiny_resolution: "url1.jpg" },
            statistic: { total_followers_num: 100 },
            name: "User One",
        },
        {
            id: BigInt(2),
            username: "user2",
            score: 8,
            verifyed: false as const,
            you_follow: false,
            blocked: false,
            profile_picture: { tiny_resolution: "url2.jpg" },
            statistic: { total_followers_num: 50 },
            name: "User Two",
        },
    ]

    const unknownCandidatesMock = [
        {
            id: BigInt(3),
            username: "user3",
            score: 9,
            verifyed: false as const,
            you_follow: false,
            blocked: false,
            profile_picture: { tiny_resolution: "url3.jpg" },
            statistic: { total_followers_num: 75 },
            name: "User Three",
        },
        {
            id: BigInt(4),
            username: "user4",
            score: 7,
            verifyed: false as const,
            you_follow: true,
            blocked: false,
            profile_picture: { tiny_resolution: "url4.jpg" },
            statistic: { total_followers_num: 25 },
            name: "User Four",
        },
    ]

    const mixedCandidatesMock = [
        {
            id: BigInt(1),
            username: "user1",
            score: 10,
            verifyed: false as const,
            you_follow: true,
            blocked: false,
            profile_picture: { tiny_resolution: "url1.jpg" },
            statistic: { total_followers_num: 100 },
            name: "User One",
        },
        {
            id: BigInt(3),
            username: "user3",
            score: 9,
            verifyed: false as const,
            you_follow: false,
            blocked: false,
            profile_picture: { tiny_resolution: "url3.jpg" },
            statistic: { total_followers_num: 75 },
            name: "User Three",
        },
        {
            id: BigInt(2),
            username: "user2",
            score: 8,
            verifyed: false as const,
            you_follow: false,
            blocked: false,
            profile_picture: { tiny_resolution: "url2.jpg" },
            statistic: { total_followers_num: 50 },
            name: "User Two",
        },
        {
            id: BigInt(4),
            username: "user4",
            score: 7,
            verifyed: false as const,
            you_follow: true,
            blocked: false,
            profile_picture: { tiny_resolution: "url4.jpg" },
            statistic: { total_followers_num: 25 },
            name: "User Four",
        },
    ]

    const filteredCandidatesMock = [
        {
            id: BigInt(1),
            username: "user1",
            verifyed: false as const,
            you_follow: true,
            name: "User One",
            profile_picture: { tiny_resolution: "url1.jpg" },
            statistics: { total_followers_num: 100 },
        },
        {
            id: BigInt(3),
            username: "user3",
            verifyed: false as const,
            you_follow: false,
            name: "User Three",
            profile_picture: { tiny_resolution: "url3.jpg" },
            statistics: { total_followers_num: 75 },
        },
        {
            id: BigInt(2),
            username: "user2",
            verifyed: false as const,
            you_follow: false,
            name: "User Two",
            profile_picture: { tiny_resolution: "url2.jpg" },
            statistics: { total_followers_num: 50 },
        },
    ]

    beforeEach(() => {
        vi.resetAllMocks()

        // Setup default mock behaviors
        vi.mocked(related_candidates).mockResolvedValue(relatedCandidatesMock)
        vi.mocked(unknown_candidates).mockResolvedValue(unknownCandidatesMock)
        vi.mocked(mix_lists).mockReturnValue(mixedCandidatesMock)
        vi.mocked(security_filter).mockReturnValue(filteredCandidatesMock)
    })

    it("Should orchestrate the search process correctly", async () => {
        const userId = BigInt(1)
        const searchTerm = "test"
        const mixCoefficient = 0.8 // Valor assumido do config

        const result = await search_mixer({ user_id: userId, search_term: searchTerm })

        // Verificar se cada módulo foi chamado corretamente
        expect(related_candidates).toHaveBeenCalledWith({
            user_id: userId,
            search_term: searchTerm,
        })

        expect(unknown_candidates).toHaveBeenCalledWith({
            user_id: userId,
            search_term: searchTerm,
            related_candidates_list: relatedCandidatesMock,
        })

        expect(mix_lists).toHaveBeenCalledWith(
            relatedCandidatesMock,
            unknownCandidatesMock,
            mixCoefficient
        )

        expect(security_filter).toHaveBeenCalledWith({ candidates: mixedCandidatesMock })

        // Verificar se o resultado final é o esperado
        expect(result).toEqual(filteredCandidatesMock)
    })

    it("Should handle empty related candidates", async () => {
        vi.mocked(related_candidates).mockResolvedValueOnce([])

        await search_mixer({ user_id: BigInt(1), search_term: "test" })

        // Verificar se o unknown_candidates é chamado com lista vazia
        expect(unknown_candidates).toHaveBeenCalledWith(
            expect.objectContaining({
                related_candidates_list: [],
            })
        )
    })

    it("Should handle empty unknown candidates", async () => {
        vi.mocked(unknown_candidates).mockResolvedValueOnce([])

        await search_mixer({ user_id: BigInt(1), search_term: "test" })

        // Verificar se o mix_lists é chamado com unknown_candidates vazio
        expect(mix_lists).toHaveBeenCalledWith(relatedCandidatesMock, [], expect.any(Number))
    })

    it("Should handle errors from related_candidates", async () => {
        const errorMessage = "Failed to fetch related candidates"
        vi.mocked(related_candidates).mockRejectedValueOnce(new Error(errorMessage))

        await expect(search_mixer({ user_id: BigInt(1), search_term: "test" })).rejects.toThrow(
            errorMessage
        )

        // Verificar que unknown_candidates não foi chamado após o erro
        expect(unknown_candidates).not.toHaveBeenCalled()
    })
})
