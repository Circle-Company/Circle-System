import { describe, expect, it } from "vitest"
import { filter_candidates } from "../filter_candidates"

describe("filter_candidates", () => {
    it("Should filter candidates based on search term", async () => {
        const searchTerm = "john"
        const candidates = [
            { user: { username: "john_doe", user_id: BigInt(1) }, weight: 10 },
            { user: { username: "jane_doe", user_id: BigInt(2) }, weight: 5 },
            { user: { username: "johnny_bravo", user_id: BigInt(3) }, weight: 3 },
            { user: { username: "mike_smith", user_id: BigInt(4) }, weight: 2 },
        ]

        const result = await filter_candidates({
            search_term: searchTerm,
            candidates_without_duplication: candidates,
        })

        expect(result).toHaveLength(2)
        expect(result[0].user.username).toBe("john_doe")
        expect(result[1].user.username).toBe("johnny_bravo")
    })

    it("Should return empty array when no matches found", async () => {
        const searchTerm = "xyz"
        const candidates = [
            { user: { username: "john_doe", user_id: BigInt(1) }, weight: 10 },
            { user: { username: "jane_doe", user_id: BigInt(2) }, weight: 5 },
        ]

        const result = await filter_candidates({
            search_term: searchTerm,
            candidates_without_duplication: candidates,
        })

        expect(result).toHaveLength(0)
    })
})
