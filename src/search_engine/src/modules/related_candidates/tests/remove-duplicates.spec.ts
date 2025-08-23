import { describe, expect, it } from "vitest"
import { remove_duplicates } from "../remove_duplicates"

describe("remove_duplicates", () => {
    it("Should remove duplicate candidates", async () => {
        const candidates = [
            { user: { username: "john", user_id: BigInt(1) }, weight: 10 },
            { user: { username: "jane", user_id: BigInt(2) }, weight: 5 },
            { user: { username: "john", user_id: BigInt(1) }, weight: 3 }, // Duplicate
            { user: { username: "mike", user_id: BigInt(3) }, weight: 2 },
        ]

        const result = remove_duplicates({ finded_candidates: candidates })

        expect(result).toHaveLength(3)
        // Verificar se a primeira ocorrência de cada ID único está presente (não necessariamente na mesma ordem)
        expect(
            result.some((c) => c.user.username === "john" && c.user.user_id.toString() === "1")
        ).toBe(true)
        expect(
            result.some((c) => c.user.username === "jane" && c.user.user_id.toString() === "2")
        ).toBe(true)
        expect(
            result.some((c) => c.user.username === "mike" && c.user.user_id.toString() === "3")
        ).toBe(true)
        // Verificar se a duplicata foi removida
        expect(result.filter((c) => c.user.user_id.toString() === "1")).toHaveLength(1)
    })
})
