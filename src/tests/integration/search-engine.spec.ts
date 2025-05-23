import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SearchEngine } from "../../search_engine"
import { testBearerToken } from "../app-test"

// Mock de toda a funcionalidade do SearchEngine para isolamento dos testes
vi.mock("../../search_engine", () => {
    return {
        SearchEngine: vi.fn(() => Promise.resolve([])),
    }
})

// Mock dos modelos necessários
vi.mock("../../models/user/user-model", () => ({
    default: {
        findAll: vi.fn(),
        findOne: vi.fn(),
    },
}))

vi.mock("../../models/user/relation-model", () => ({
    default: {
        findAll: vi.fn(),
    },
}))

// Cria um route handler separado para teste
const router = express.Router()

router.get("/search", async (req, res) => {
    try {
        const searchTerm = req.query.q as string
        const userId = req.user_id as bigint

        if (!searchTerm) {
            return res.status(400).json({
                message: "Search term is required",
            })
        }

        const results = await SearchEngine({
            userId,
            searchTerm,
        })

        return res.status(200).json({
            results,
            count: results.length,
        })
    } catch (error: any) {
        return res.status(400).json({
            message: error.message || "An error occurred during search",
        })
    }
})

describe("Search Engine API Integration", () => {
    const app = express()
    app.use(express.json())

    // Middleware de autenticação mock
    app.use((req, res, next) => {
        if (req.headers.authorization === testBearerToken) {
            req.user_id = BigInt(1) // Simula um ID de usuário autenticado
            next()
        } else {
            res.status(401).json({ message: "Unauthorized: token is missing or invalid" })
        }
    })

    app.use("/v1", router)

    const SEARCH_PATH = "/v1/search"
    const mockSearchResults: any = [
        {
            id: 2,
            username: "usuario2",
            verifyed: false,
            name: "Usuário 2",
            profile_picture: {
                tiny_resolution: "https://example.com/profile2.jpg",
            },
            statistics: {
                total_followers_num: 10,
            },
            you_follow: false,
        },
        {
            id: 3,
            username: "usuario3",
            verifyed: false,
            name: "Usuário 3",
            profile_picture: {
                tiny_resolution: "https://example.com/profile3.jpg",
            },
            statistics: {
                total_followers_num: 5,
            },
            you_follow: true,
        },
    ]

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks()

        // Configurar o mock de SearchEngine de forma explícita
        vi.mocked(SearchEngine).mockImplementation(() => {
            return Promise.resolve([...mockSearchResults]) // Retornar cópia para evitar mutações
        })
    })

    it("Should return search results for valid query", async () => {
        const response = await request(app)
            .get(SEARCH_PATH)
            .set("authorization", testBearerToken)
            .query({ q: "user" })

        // Validar que o SearchEngine foi chamado com os parâmetros corretos
        expect(SearchEngine).toHaveBeenCalledWith({
            userId: BigInt(1),
            searchTerm: "user",
        })

        // Verificar os resultados da resposta
        expect(response.status).toBe(200)
        expect(response.body.results).toHaveLength(2)
        expect(response.body.count).toBe(2)
    })

    it("Should return 400 if search term is missing", async () => {
        const response = await request(app).get(SEARCH_PATH).set("authorization", testBearerToken)

        expect(response.status).toBe(400)
        expect(response.body.message).toContain("Search term is required")
    })

    it("Should return 401 if authorization token is missing", async () => {
        const response = await request(app).get(SEARCH_PATH).query({ q: "testquery" })

        expect(response.status).toBe(401)
        expect(response.body.message).toContain("Unauthorized")
    })

    it("Should return validation error if search term is invalid", async () => {
        // Mock SearchEngine para lançar erro de validação
        vi.mocked(SearchEngine).mockRejectedValueOnce(new Error("Invalid search term"))

        const response = await request(app)
            .get(SEARCH_PATH)
            .set("authorization", testBearerToken)
            .query({ q: "invalid!@#$" })

        expect(response.status).toBe(400)
        expect(response.body.message).toContain("Invalid search term")
    })

    it("Should properly handle empty search results", async () => {
        // Mock SearchEngine para retornar resultados vazios
        vi.mocked(SearchEngine).mockResolvedValueOnce([])

        const response = await request(app)
            .get(SEARCH_PATH)
            .set("authorization", testBearerToken)
            .query({ q: "notfound" })

        expect(response.status).toBe(200)
        expect(response.body.results).toEqual([])
        expect(response.body.count).toBe(0)
    })
})
