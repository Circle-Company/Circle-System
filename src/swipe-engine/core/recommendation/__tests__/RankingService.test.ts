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
                statistics: undefined
            } as unknown as Candidate
        ]

        const result = rankingService.rankCandidates(invalidCandidates, {
            userEmbedding: mockUserEmbedding,
            userProfile: null
        })

        expect(Array.isArray(result)).toBe(true)
        expect(result[0]).toHaveProperty("finalScore")
        expect(Math.abs(result[0].finalScore - 0.5)).toBeLessThanOrEqual(0.01)
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

    it("deve calcular score de diversidade corretamente", () => {
        // Teste com candidato com tags e engajamento diverso
        const diverseCandidate: Candidate = {
            id: 1,
            created_at: new Date(),
            tags: ["tecnologia", "programação", "inovação", "startup", "desenvolvimento"],
            statistics: {
                likes: 100,
                comments: 80,
                shares: 70,
                views: 1000
            }
        }

        // Teste com candidato sem tags e engajamento concentrado
        const nonDiverseCandidate: Candidate = {
            id: 2,
            created_at: new Date(),
            tags: ["tecnologia"],
            statistics: {
                likes: 1000,
                comments: 10,
                shares: 5,
                views: 5000
            }
        }

        // Teste com candidato sem dados suficientes
        const minimalCandidate: Candidate = {
            id: 3,
            created_at: new Date()
        }

        const diverseResult = rankingService.rankCandidates([diverseCandidate], {
            userEmbedding: mockUserEmbedding,
            userProfile: null
        })

        const nonDiverseResult = rankingService.rankCandidates([nonDiverseCandidate], {
            userEmbedding: mockUserEmbedding,
            userProfile: null
        })

        const minimalResult = rankingService.rankCandidates([minimalCandidate], {
            userEmbedding: mockUserEmbedding,
            userProfile: null
        })

        // Verificar scores de diversidade
        expect(diverseResult[0].diversityScore).toBeGreaterThan(nonDiverseResult[0].diversityScore)
        expect(minimalResult[0].diversityScore).toBe(0.5) // Score padrão
        expect(diverseResult[0].diversityScore).toBeGreaterThan(0.5) // Deve ser maior que o padrão
        expect(nonDiverseResult[0].diversityScore).toBeLessThan(0.5) // Deve ser menor que o padrão
    })

    it("deve calcular score de contexto corretamente", () => {
        const candidate: Candidate = {
            id: 1,
            created_at: new Date(),
            location: "BR",
            statistics: {
                likes: 100,
                comments: 20,
                shares: 5,
                views: 1000
            }
        }

        // Teste com contexto de horário de pico
        const peakHourResult = rankingService.rankCandidates([candidate], {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            context: {
                timeOfDay: 8, // Manhã (horário de pico)
                dayOfWeek: 1, // Segunda-feira
                location: "BR"
            }
        })

        // Teste com contexto de horário de baixo engajamento
        const lowEngagementResult = rankingService.rankCandidates([candidate], {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            context: {
                timeOfDay: 3, // Madrugada (baixo engajamento)
                dayOfWeek: 1,
                location: "BR"
            }
        })

        // Teste com contexto de fim de semana
        const weekendResult = rankingService.rankCandidates([candidate], {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            context: {
                timeOfDay: 14,
                dayOfWeek: 0, // Domingo
                location: "BR"
            }
        })

        // Teste com contexto de localização diferente
        const differentLocationResult = rankingService.rankCandidates([candidate], {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            context: {
                timeOfDay: 14,
                dayOfWeek: 1,
                location: "US"
            }
        })

        // Teste sem contexto
        const noContextResult = rankingService.rankCandidates([candidate], {
            userEmbedding: mockUserEmbedding,
            userProfile: null
        })

        // Verificar scores de contexto
        expect(peakHourResult[0].contextScore).toBeGreaterThan(lowEngagementResult[0].contextScore)
        expect(weekendResult[0].contextScore).toBeGreaterThan(noContextResult[0].contextScore)
        expect(differentLocationResult[0].contextScore).toBeLessThan(peakHourResult[0].contextScore)
        expect(noContextResult[0].contextScore).toBe(0.5) // Score padrão sem contexto

        // Verificar se todos os scores estão no intervalo [0,1]
        const allResults = [
            peakHourResult[0],
            lowEngagementResult[0],
            weekendResult[0],
            differentLocationResult[0],
            noContextResult[0]
        ]

        allResults.forEach(result => {
            expect(result.contextScore).toBeGreaterThanOrEqual(0)
            expect(result.contextScore).toBeLessThanOrEqual(1)
        })
    })

    it("deve tratar erros em cálculos de diversidade e contexto", () => {
        // Teste com candidato com dados inválidos
        const invalidCandidate: Candidate = {
            id: 1,
            created_at: "invalid date",
            tags: null as any,
            statistics: undefined,
            location: undefined
        }

        const result = rankingService.rankCandidates([invalidCandidate], {
            userEmbedding: mockUserEmbedding,
            userProfile: null,
            context: {
                timeOfDay: "invalid" as any,
                dayOfWeek: "invalid" as any,
                location: undefined
            }
        })

        // Verificar se os scores padrão são retornados em caso de erro
        expect(result[0].diversityScore).toBe(0.5)
        expect(result[0].contextScore).toBe(0.5)
        expect(result[0].finalScore).toBe(0.5)
    })
})
