import { describe, expect, it } from "vitest"
import { security_filter } from "../security_filter"

describe("security_filter", () => {
    it("Should filter out blocked users", () => {
        const candidates = [
            {
                id: BigInt(1),
                username: "user1",
                blocked: false,
                verifyed: true,
                you_follow: true,
                name: "User One",
                statistic: {},
                profile_picture: {},
            },
            {
                id: BigInt(2),
                username: "user2",
                blocked: true,
                verifyed: false,
                you_follow: false,
                name: "User Two",
                statistic: {},
                profile_picture: {},
            },
            {
                id: BigInt(3),
                username: "user3",
                blocked: false,
                verifyed: true,
                you_follow: true,
                name: "User Three",
                statistic: {},
                profile_picture: {},
            },
        ]

        const filtered = security_filter({ candidates })

        expect(filtered).toHaveLength(2)
        expect(filtered.some((user) => user.id.toString() === "2")).toBe(false)
    })

    it("Should transform user data to expected format", () => {
        const candidates = [
            {
                id: BigInt(1),
                username: "user1",
                blocked: false,
                verifyed: true,
                you_follow: true,
                name: "User One",
                statistic: { total_followers_num: 10 },
                profile_picture: { tiny_resolution: "url/image.jpg" },
            },
        ]

        const filtered = security_filter({ candidates })

        expect(filtered).toHaveLength(1)
        expect(filtered[0]).toEqual({
            id: BigInt(1),
            username: "user1",
            name: "User One",
            verifyed: true,
            you_follow: true,
            statistic: { total_followers_num: 10 },
            profile_picture: { tiny_resolution: "url/image.jpg" },
        })
    })
})
