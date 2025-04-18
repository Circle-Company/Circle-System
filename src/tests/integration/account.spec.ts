import { router } from "@routes/account-router"
import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { testBearerToken } from "../app-test"

// Mock dos modelos com vi.mock
vi.mock("@models/user/follow-model")
vi.mock("@models/user/profilepicture-model")
vi.mock("@models/user/statistic-model")
vi.mock("@models/user/user-model")

describe("GET /account/list/followings", () => {
    const app = express()
    app.use(express.json())

    // Mock do middleware de autenticação
    app.use((req, res, next) => {
        if (req.headers.authorization === testBearerToken) {
            req.user_id = BigInt(1) // Simula um ID de usuário autenticado
            next()
        } else {
            res.status(401).json({ message: "token is missing" })
        }
    })

    app.use("/account", router)

    const PATH = "/list/followings" // Removido o prefixo /account duplicado
    const AUTH_TOKEN = testBearerToken

    let MockedFollow: any

    beforeEach(async () => {
        vi.clearAllMocks()
        MockedFollow = vi.mocked((await import("@models/user/follow-model")).default, true)
        MockedFollow.findAndCountAll.mockResolvedValue({ rows: [], count: 0 })
    })

    it("Deve retornar a lista de usuários seguidos com paginação", async () => {
        const mockFollowData = {
            rows: [
                {
                    created_at: new Date(),
                    followers: {
                        id: "1",
                        username: "testuser1",
                        name: "Test User One",
                        verifyed: true,
                        profile_pictures: { tiny_resolution: "url/to/picture1" },
                        statistics: { total_followers_num: 10 },
                    },
                },
                {
                    created_at: new Date(),
                    followers: {
                        id: "2",
                        username: "testuser2",
                        name: "Test User Two",
                        verifyed: false,
                        profile_pictures: { tiny_resolution: "url/to/picture2" },
                        statistics: { total_followers_num: 5 },
                    },
                },
            ],
            count: 2,
        }
        MockedFollow.findAndCountAll.mockResolvedValueOnce(mockFollowData)

        const response = await request(app)
            .get("/account" + PATH)
            .set("authorization", AUTH_TOKEN)
            .query({ limit: 5, page: 1 })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("data")
        expect(response.body.data).toHaveLength(2)
        expect(response.body.pagination.totalItems).toBe(2)
    })

    it("Deve retornar a estrutura correta para os usuários seguidos", async () => {
        const followDate = new Date()
        const mockFollowData = {
            rows: [
                {
                    created_at: followDate,
                    followers: {
                        id: "123",
                        username: "followTest",
                        verifyed: false,
                        profile_pictures: { tiny_resolution: "url/tiny.jpg" },
                        statistics: { total_followers_num: 99 },
                    },
                },
            ],
            count: 1,
        }
        MockedFollow.findAndCountAll.mockResolvedValueOnce(mockFollowData)

        const response = await request(app)
            .get("/account" + PATH)
            .set("authorization", AUTH_TOKEN)
            .query({ limit: 1, page: 1 })

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveLength(1)
        const item = response.body.data[0]
        expect(item).toEqual({
            id: "123",
            username: "followTest",
            verifyed: false,
            profile_picture: { tiny_resolution: "url/tiny.jpg" },
            statistic: { total_followers_num: 99 },
            followed_at: followDate.toISOString(),
        })
        expect(response.body.pagination).toEqual({
            totalItems: 1,
            totalPages: 1,
            currentPage: 1,
            pageSize: 1,
        })
    })

    it("Deve retornar erro 401 se o token de autenticação estiver faltando", async () => {
        const response = await request(app)
            .get("/account" + PATH)
            .query({ limit: 5, page: 1 })
        expect(response.status).toBe(401)
        expect(response.body.message).toContain("token is missing")
    })

    it("Deve retornar uma lista vazia se o usuário não seguir ninguém", async () => {
        const response = await request(app)
            .get("/account" + PATH)
            .set("authorization", AUTH_TOKEN)
            .query({ limit: 5, page: 1 })
        expect(response.status).toBe(200)
        expect(response.body.data).toEqual([])
        expect(response.body.pagination.totalItems).toBe(0)
    })

    it("Deve retornar erro 500 se a consulta ao banco falhar", async () => {
        const errorMessage = "Database connection error"
        MockedFollow.findAndCountAll.mockRejectedValueOnce(new Error(errorMessage))
        const response = await request(app)
            .get("/account" + PATH)
            .set("authorization", AUTH_TOKEN)
            .query({ limit: 5, page: 1 })

        expect(response.status).toBe(500)
    })
})
