import { beforeEach, describe, expect, it, vi } from "vitest"
import { SearchEngine } from "../index"
import { isValidSearch } from "../src/modules/is_valid_search"
import { search_mixer } from "../src/modules/search_mixer"

// Mock dos módulos dependentes
vi.mock("../src/modules/is_valid_search", () => ({
    isValidSearch: vi.fn(),
}))

vi.mock("../src/modules/search_mixer", () => ({
    search_mixer: vi.fn(),
}))

describe("SearchEngine Main Function", () => {
    const mockSearchResults = [
        {
            id: BigInt(1),
            username: "user1",
            verifyed: true,
            name: "User One",
            profile_picture: { tiny_resolution: "url/image1.jpg" },
            statistics: { total_followers_num: 10 },
            you_follow: true,
        },
        {
            id: BigInt(2),
            username: "user2",
            verifyed: false,
            name: "User Two",
            profile_picture: { tiny_resolution: "url/image2.jpg" },
            statistics: { total_followers_num: 5 },
            you_follow: false,
        },
    ]

    beforeEach(() => {
        vi.resetAllMocks()

        // Setup default mock behaviors
        vi.mocked(isValidSearch).mockReturnValue({ isValid: true })
        vi.mocked(search_mixer).mockResolvedValue(mockSearchResults)
    })

    it("Should validate search term and call search_mixer on valid search", async () => {
        const userId = BigInt(1)
        const searchTerm = "validTerm"

        const result = await SearchEngine({ userId, searchTerm })

        expect(isValidSearch).toHaveBeenCalledWith(searchTerm)
        expect(search_mixer).toHaveBeenCalledWith({ user_id: userId, search_term: searchTerm })
        expect(result).toEqual(mockSearchResults)
    })

    it("Should throw validation error if search term is invalid", async () => {
        const errorMessage = "Invalid search term"
        vi.mocked(isValidSearch).mockReturnValue({ isValid: false, message: errorMessage })

        await expect(SearchEngine({ userId: BigInt(1), searchTerm: "invalid" })).rejects.toThrow(
            errorMessage
        )

        expect(search_mixer).not.toHaveBeenCalled()
    })

    it("Should pass through error from search_mixer", async () => {
        const errorMessage = "Database error"
        vi.mocked(search_mixer).mockRejectedValue(new Error(errorMessage))

        await expect(SearchEngine({ userId: BigInt(1), searchTerm: "test" })).rejects.toThrow(
            errorMessage
        )
    })

    it("Should handle empty search results", async () => {
        vi.mocked(search_mixer).mockResolvedValue([])

        const result = await SearchEngine({ userId: BigInt(1), searchTerm: "noResults" })
        expect(result).toEqual([])
    })

    it("Should propagate user ID correctly", async () => {
        const userId = BigInt(9999)
        await SearchEngine({ userId, searchTerm: "test" })

        expect(search_mixer).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId }))
    })
})
