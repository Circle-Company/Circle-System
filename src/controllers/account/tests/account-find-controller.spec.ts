import request from "supertest"
import Follow from "../../../models/user/follow-model"
import app, { testBearerToken } from "../../../tests/app-test"

jest.mock("../../../models/user/follow-model")
jest.mock("../../../models/user/profilepicture-model")
jest.mock("../../../models/user/statistic-model")

describe("findAccountFollowings Endpoint", () => {
    const PATH = "/v1.0.0/account/list/followings"
    const AUTH_TOKEN = testBearerToken

    beforeEach(() => {
        jest.clearAllMocks() // Limpa mocks entre testes
    })

    it("Should return the list of followings with pagination", async () => {
        // Mocka o comportamento do Follow.findAndCountAll
        ;(Follow.findAndCountAll as jest.Mock).mockResolvedValue({
            rows: [
                {
                    followers: {
                        id: "1",
                        username: "testuser",
                        name: "Test User",
                        verifyed: true,
                        profile_pictures: { tiny_resolution: "url/to/picture" },
                        statistics: { total_followers_num: 10 },
                    },
                },
            ],
            count: 1,
        })

        const response = await request(app)
            .get(PATH)
            .set("authorization_token", AUTH_TOKEN)
            .query({ limit: 5, page: 1 })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("data")
        expect(response.body.data).toHaveLength(1)
        expect(response.body.pagination.totalItems).toBe(1)
    })

    it("Should return the correct structure for followings", async () => {
        // Mock dos dados retornados pela consulta
        ;(Follow.findAndCountAll as jest.Mock).mockResolvedValue({
            rows: [
                {
                    followers: {
                        id: "1",
                        username: "testuser",
                        verifyed: true,
                        profile_pictures: { tiny_resolution: "url/to/picture" },
                        statistics: { total_followers_num: 10 },
                    },
                },
            ],
            count: 1,
        })

        const response = await request(app)
            .get(PATH)
            .set("authorization_token", AUTH_TOKEN)
            .query({ limit: 5, page: 1 })

        // Verifica o status da resposta
        expect(response.status).toBe(200)

        // Valida a estrutura do objeto principal
        expect(response.body).toHaveProperty("data")
        expect(response.body).toHaveProperty("pagination")

        // Valida a estrutura de cada item em `data`
        response.body.data.forEach((item: any) => {
            expect(item).toHaveProperty("id")
            expect(item).toHaveProperty("username")
            expect(item).toHaveProperty("verifyed")
            expect(item).toHaveProperty("profile_picture")
            expect(item.profile_picture).toHaveProperty("tiny_resolution")
            expect(item).toHaveProperty("statistic")
            expect(item.statistic).toHaveProperty("total_followers_num")

            // Tipagem explícita (opcional)
            expect(typeof item.id).toBe("string")
            expect(typeof item.username).toBe("string")
            expect(typeof item.verifyed).toBe("boolean")
            expect(typeof item.profile_picture.tiny_resolution).toBe("string")
            expect(typeof item.statistic.total_followers_num).toBe("number")
        })

        // Valida a estrutura de `pagination`
        expect(response.body.pagination).toHaveProperty("totalItems")
        expect(response.body.pagination).toHaveProperty("totalPages")
        expect(response.body.pagination).toHaveProperty("currentPage")
        expect(response.body.pagination).toHaveProperty("pageSize")

        // Tipagem explícita (opcional)
        expect(typeof response.body.pagination.totalItems).toBe("number")
        expect(typeof response.body.pagination.totalPages).toBe("number")
        expect(typeof response.body.pagination.currentPage).toBe("number")
        expect(typeof response.body.pagination.pageSize).toBe("number")
    })

    it("Should return a validation error if user ID is missing", async () => {
        // enviando requisição sem authorization_token
        const response = await request(app).get(PATH).query({ limit: 5, page: 1 })
        expect(response.status).toBe(401)
    })

    it("Should return an empty list if the user has no followings", async () => {
        // Mocka o comportamento para não encontrar followings
        ;(Follow.findAndCountAll as jest.Mock).mockResolvedValue({
            rows: [],
            count: 0,
        })

        const response = await request(app)
            .get(PATH)
            .set("authorization_token", AUTH_TOKEN)
            .query({ limit: 5, page: 1 })

        expect(response.status).toBe(200)
        expect(response.body.data).toEqual([])
        expect(response.body.pagination.totalItems).toBe(0)
    })
})
