import { describe, expect, it } from "vitest"

import { isValidSearch } from "./is_valid_search"

describe("isValidSearch", () => {
    it("Should validate a proper search term", () => {
        const result = isValidSearch("validSearchTerm")
        expect(result.isValid).toBe(true)
    })

    it("Should reject an empty search term", () => {
        const result = isValidSearch("")
        expect(result.isValid).toBe(false)
        expect(result.message).toContain("cannot be empty")
    })

    it("Should reject non-string inputs", () => {
        // @ts-ignore - Testing invalid input intentionally
        const result = isValidSearch(123)
        expect(result.isValid).toBe(false)
        expect(result.message).toContain("must be a string")
    })

    it("Should validate search terms within length limits", () => {
        // Assuming the rules are min_search_length=1, max_search_length=50
        const shortTerm = "a"
        const longTerm = "a".repeat(50)
        const tooLongTerm = "a".repeat(51)

        expect(isValidSearch(shortTerm).isValid).toBe(true)
        expect(isValidSearch(longTerm).isValid).toBe(true)
        expect(isValidSearch(tooLongTerm).isValid).toBe(false)
    })

    it("Should reject potentially dangerous search terms", () => {
        // SQL injection attempt
        const sqlInjection = "user'; DROP TABLE users; --"
        const result = isValidSearch(sqlInjection)

        // This test depends on the security-toolkit implementation
        // It might need adjustment based on the actual implementation
        expect(result.isValid).toBe(false)
    })
})
