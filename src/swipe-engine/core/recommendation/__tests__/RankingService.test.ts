import { beforeEach, describe, expect, it } from "vitest"
import { Candidate, UserEmbedding } from "../../types"
import { RankingService } from "../RankingService"

describe("RankingService", () => {
    let rankingService: RankingService
    let mockCandidates: Candidate[]
    let mockUserEmbedding: UserEmbedding

    beforeEach(() => {
        rankingService = new RankingService()

        // Mock para candidatos
        mockCandidates = [
            {
                id: 1,
                created_at: new Date(Date.now() - 3600000), // 1 hora atrás
                statistics: { likes: 100, comments: 20, shares: 5, views: 1000 },
                embedding: {
                    userId: "test",
                    vector: {
                        dimension: 3,
                        values: [0.5, 0.3, 0.2],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                },
            },
            {
                id: 2,
                created_at: new Date(Date.now() - 7200000), // 2 horas atrás
                statistics: { likes: 50, comments: 10, shares: 2, views: 500 },
                embedding: {
                    userId: "test",
                    vector: {
                        dimension: 3,
                        values: [0.1, 0.8, 0.1],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                },
            },
            {
                id: 3,
                created_at: new Date(), // Agora
                statistics: { likes: 10, comments: 2, shares: 1, views: 100 },
                embedding: {
                    userId: "test",
                    vector: {
                        dimension: 3,
                        values: [0.2, 0.2, 0.6],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                },
            },
        ]

        // Mock para embedding do usuário
        mockUserEmbedding = {
            userId: "user1",
            vector: {
                dimension: 3,
                values: [0.2, 0.3, 0.5],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        }
    })

    it("deve classificar candidatos com base em scores", async () => {
        const result = await rankingService.rankCandidates(mockCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            limit: 3,
        })

        expect(result).toHaveLength(3)
        expect(result[0]).toHaveProperty("finalScore")
        expect(result[1]).toHaveProperty("finalScore")
        expect(result[2]).toHaveProperty("finalScore")

        // Verificar se os candidatos estão ordenados por finalScore
        expect(result[0].finalScore).toBeGreaterThanOrEqual(result[1].finalScore)
        expect(result[1].finalScore).toBeGreaterThanOrEqual(result[2].finalScore)
    })

    it("deve limitar o número de resultados conforme especificado", async () => {
        const result = await rankingService.rankCandidates(mockCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            limit: 2,
        })

        expect(result).toHaveLength(2)
    })

    it("deve aplicar diversificação aos resultados", async () => {
        const resultWithoutDiversity = await rankingService.rankCandidates(mockCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            diversityLevel: 0,
        })

        const resultWithDiversity = await rankingService.rankCandidates(mockCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            diversityLevel: 1,
        })

        // Não podemos testar exatamente a ordem, mas podemos verificar
        // se existem os mesmos itens em ordens potencialmente diferentes
        expect(resultWithoutDiversity.map((r) => r.id).sort()).toEqual(
            resultWithDiversity.map((r) => r.id).sort()
        )

        // A ordem provavelmente deve ser diferente com diversidade alta
        const orderMatches = resultWithoutDiversity
            .map((r) => r.id)
            .every((id, index) => id === resultWithDiversity[index].id)

        // Pode falhar ocasionalmente se a ordem for a mesma por coincidência
        expect(orderMatches).toBe(false)
    })

    it("deve tratar erros graciosamente", async () => {
        // Mock de candidato com dados inválidos
        const invalidCandidates = [
            {
                id: 1,
                created_at: "invalid date",
                statistics: null,
            } as unknown as Candidate,
        ]

        // Não deve lançar erro, apenas retornar array vazio
        const result = await rankingService.rankCandidates(invalidCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
        })

        expect(Array.isArray(result)).toBe(true)
    })

    it("deve calcular scores para candidatos sem embedding", async () => {
        const candidatesWithoutEmbedding = [
            {
                id: 1,
                created_at: new Date(),
                statistics: { likes: 100, comments: 20, shares: 5, views: 1000 },
            } as Candidate,
        ]

        const result = await rankingService.rankCandidates(candidatesWithoutEmbedding, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
        })

        expect(result).toHaveLength(1)
        expect(result[0]).toHaveProperty("finalScore")
        // Espera-se um score de relevância default para candidatos sem embedding
        expect(result[0].relevanceScore).toBe(0.5)
    })

    it("deve funcionar sem embedding de usuário", async () => {
        const result = await rankingService.rankCandidates(mockCandidates, {
            userEmbedding: null,
            userProfile: null,
        })

        expect(result).toHaveLength(3)
        // Espera-se que todos os candidatos tenham um score de relevância padrão
        expect(result.every((r) => r.relevanceScore === 0.5)).toBe(true)
    })
})
