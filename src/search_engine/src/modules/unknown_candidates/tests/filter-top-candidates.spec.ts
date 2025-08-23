import { describe, expect, it } from "vitest"
import { filter_top_candidates } from "../filter_top_candidates"

describe("filter_top_candidates", () => {
    it("Should return top N candidates by score", () => {
        const candidates = [
            { id: 1, username: "user1", score: 30 },
            { id: 2, username: "user2", score: 25 },
            { id: 3, username: "user3", score: 20 },
            { id: 4, username: "user4", score: 15 },
            { id: 5, username: "user5", score: 10 },
        ]

        const result = filter_top_candidates({ sorted_candidates: candidates, count: 3 })

        expect(result).toHaveLength(3)
        expect(result[0].id).toBe(1)
        expect(result[1].id).toBe(2)
        expect(result[2].id).toBe(3)
    })

    it("Should handle empty input", () => {
        const result = filter_top_candidates({ sorted_candidates: [], count: 5 })
        expect(result).toHaveLength(0)
    })

    it("Should handle count larger than input array", () => {
        const candidates = [
            { id: 1, username: "user1", score: 30 },
            { id: 2, username: "user2", score: 25 },
        ]

        const result = filter_top_candidates({ sorted_candidates: candidates, count: 5 })

        expect(result).toHaveLength(2)
    })
})
