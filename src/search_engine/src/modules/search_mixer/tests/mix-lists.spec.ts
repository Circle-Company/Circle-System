import { describe, expect, it } from "vitest"
import { mix_lists } from "../mix_lists"

describe("mix_lists", () => {
    it("Should mix and sort two lists by score", () => {
        const list1 = [
            { id: 1, username: "user1", score: 10 },
            { id: 2, username: "user2", score: 8 },
        ]

        const list2 = [
            { id: 3, username: "user3", score: 9 },
            { id: 4, username: "user4", score: 7 },
        ]

        const mixedList = mix_lists(list1, list2, 0.8)

        expect(mixedList).toHaveLength(4)
        expect(mixedList[0].score).toBe(10) // Highest score first
        expect(mixedList[1].score).toBe(9)
        expect(mixedList[2].score).toBe(8)
        expect(mixedList[3].score).toBe(7)
    })

    it("Should handle empty lists", () => {
        const emptyList1 = []
        const emptyList2 = []
        const list = [{ id: 1, username: "user1", score: 10 }]

        expect(mix_lists(emptyList1, emptyList2, 0.8)).toEqual([])
        expect(mix_lists(list, emptyList2, 0.8)).toEqual(list)
        expect(mix_lists(emptyList1, list, 0.8)).toEqual(list)
    })
})
