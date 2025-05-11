import { beforeEach, describe, expect, it } from "vitest"
import { Candidate, UserEmbedding, EmbeddingVector } from "../../types"
import { RankingService } from "../RankingService"

describe("RankingService", () => {
    let rankingService: RankingService
    let mockCandidates: Candidate[]
    let mockUserEmbedding: UserEmbedding

    beforeEach(() => {
        rankingService = new RankingService()

        // Função auxiliar para criar vetores de embedding
        const createEmbeddingVector = (values: number[]): EmbeddingVector => ({
            dimension: values.length,
            values,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        // Mock para candidatos
        mockCandidates = [
            {
                id: 1,
                created_at: new Date(Date.now() - 3600000), // 1 hora atrás
                statistics: { likes: 100, comments: 20, shares: 5, views: 1000 },
                embedding: {
                    userId: "test",
                    vector: createEmbeddingVector([0.5, 0.3, 0.2])
                }
            },
            {
                id: 2,
                created_at: new Date(Date.now() - 7200000), // 2 horas atrás
                statistics: { likes: 50, comments: 10, shares: 2, views: 500 },
                embedding: {
                    userId: "test",
                    vector: createEmbeddingVector([0.1, 0.8, 0.1])
                }
            },
            {
                id: 3,
                created_at: new Date(), // Agora
                statistics: { likes: 10, comments: 2, shares: 1, views: 100 },
                embedding: {
                    userId: "test",
                    vector: createEmbeddingVector([0.2, 0.2, 0.6])
                }
            }
        ]

        // Mock para embedding do usuário
        mockUserEmbedding = {
            userId: "user1",
            vector: createEmbeddingVector([0.2, 0.3, 0.5])
        }
    })

    it("deve classificar candidatos com base em scores", () => {
        const result = rankingService.rankCandidates(mockCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            limit: 3
        })

        expect(result).toHaveLength(3)
        expect(result[0]).toHaveProperty("finalScore")
        expect(result[1]).toHaveProperty("finalScore")
        expect(result[2]).toHaveProperty("finalScore")

        // Verificar se os candidatos estão ordenados por finalScore
        expect(result[0].finalScore).toBeGreaterThanOrEqual(result[1].finalScore)
        expect(result[1].finalScore).toBeGreaterThanOrEqual(result[2].finalScore)
    })

    it("deve limitar o número de resultados conforme especificado", () => {
        const result = rankingService.rankCandidates(mockCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            limit: 2
        })

        expect(result).toHaveLength(2)
    })

    it("deve aplicar diversificação aos resultados", () => {
        const resultWithoutDiversity = rankingService.rankCandidates(mockCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            diversityLevel: 0
        })

        const resultWithDiversity = rankingService.rankCandidates(mockCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            diversityLevel: 1
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

    it("deve tratar erros graciosamente", () => {
        // Mock de candidato com dados inválidos
        const invalidCandidates = [
            {
                id: 1,
                created_at: "invalid date",
                statistics: null
            } as unknown as Candidate
        ]

        const result = rankingService.rankCandidates(invalidCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null
        })

        expect(Array.isArray(result)).toBe(true)
        expect(result[0]).toHaveProperty("finalScore", 0.5)
    })

    it("deve calcular scores para candidatos sem embedding", () => {
        const candidatesWithoutEmbedding = [
            {
                id: 1,
                created_at: new Date(),
                statistics: { likes: 100, comments: 20, shares: 5, views: 1000 }
            } as Candidate
        ]

        const result = rankingService.rankCandidates(candidatesWithoutEmbedding, {
            userEmbedding: mockUserEmbedding,
            userProfile: null
        })

        expect(result).toHaveLength(1)
        expect(result[0]).toHaveProperty("finalScore")
        // Espera-se um score de relevância default para candidatos sem embedding
        expect(result[0].relevanceScore).toBe(0.5)
    })

    it("deve funcionar sem embedding de usuário", () => {
        const result = rankingService.rankCandidates(mockCandidates, {
            userEmbedding: null,
            userProfile: null
        })

        expect(result).toHaveLength(3)
        // Espera-se que todos os candidatos tenham um score de relevância padrão
        expect(result.every((r) => r.relevanceScore === 0.5)).toBe(true)
    })

    it("deve considerar o contexto na classificação", () => {
        const result = rankingService.rankCandidates(mockCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            context: {
                timeOfDay: 14, // 14:00
                dayOfWeek: 1, // Segunda-feira
                location: "BR"
            }
        })

        expect(result).toHaveLength(3)
        expect(result[0]).toHaveProperty("contextScore")
        expect(result.every((r) => typeof r.contextScore === "number")).toBe(true)
    })

    it("deve ajustar pesos com base no nível de novidade", () => {
        const result = rankingService.rankCandidates(mockCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            noveltyLevel: 0.8 // Alto nível de novidade
        })

        expect(result).toHaveLength(3)
        // Com alto nível de novidade, candidatos mais recentes devem ter scores mais altos
        const newestCandidate = result.find(c => c.id === 3)
        expect(newestCandidate?.noveltyScore).toBeGreaterThan(0.5)
    })
})
