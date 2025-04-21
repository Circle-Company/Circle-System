import { describe, expect, it } from "vitest"
import { subtract_related_candidates } from "../subtract_related_candidates"

describe("subtract_related_candidates", () => {
    it("Should remove related candidates from the found candidates", async () => {
        const foundCandidates = [
            { id: BigInt(1), username: "user1" },
            { id: BigInt(2), username: "user2" },
            { id: BigInt(3), username: "user3" },
            { id: BigInt(4), username: "user4" },
        ]

        const relatedCandidates = [
            { id: BigInt(2), username: "user2" },
            { id: BigInt(4), username: "user4" },
        ]

        const result = await subtract_related_candidates({
            finded_candidates: foundCandidates,
            related_candidates_list: relatedCandidates,
        })

        expect(result).toHaveLength(2)
        expect(result[0].id).toEqual(BigInt(1))
        expect(result[1].id).toEqual(BigInt(3))
    })

    it("Should return all found candidates if related list is empty", async () => {
        const foundCandidates = [
            { id: BigInt(1), username: "user1" },
            { id: BigInt(2), username: "user2" },
        ]

        const result = await subtract_related_candidates({
            finded_candidates: foundCandidates,
            related_candidates_list: [],
        })

        expect(result).toHaveLength(2)
        expect(result).toEqual(foundCandidates)
    })
})
