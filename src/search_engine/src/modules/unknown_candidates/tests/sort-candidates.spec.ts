import { describe, expect, it } from "vitest"
import { sort_candidates } from "../sort_candidates"

describe("sort_candidates", () => {
    it("Should sort candidates by score in descending order", () => {
        const candidates = [
            { id: 1, username: "user1", score: 10 },
            { id: 2, username: "user2", score: 30 },
            { id: 3, username: "user3", score: 20 },
        ]

        const result = sort_candidates({ candidates_with_score: candidates })

        expect(result[0].id).toBe(2) // Highest score (30)
        expect(result[1].id).toBe(3) // Second highest (20)
        expect(result[2].id).toBe(1) // Lowest score (10)
    })

    it("Should handle empty input", () => {
        const result = sort_candidates({ candidates_with_score: [] })
        expect(result).toEqual([])
    })

    it("Should handle candidates with equal scores", () => {
        const candidates = [
            { id: 1, username: "user1", score: 20 },
            { id: 2, username: "user2", score: 20 },
            { id: 3, username: "user3", score: 10 },
        ]

        const result = sort_candidates({ candidates_with_score: candidates })

        // The first two could be in any order since they have equal scores,
        // but they should both come before the third item
        expect(result[0].score).toBe(20)
        expect(result[1].score).toBe(20)
        expect(result[2].score).toBe(10)
    })
})
