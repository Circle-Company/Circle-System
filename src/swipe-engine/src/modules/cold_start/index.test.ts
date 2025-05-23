import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Model } from "sequelize"
import Moment from "../../../../models/moments/moment-model"
import cold_start_algorithm from "./index"

// Mock para o modelo Moment
vi.mock("../../../../models/moments/moment-model", () => ({
    default: {
        findAll: vi.fn(),
    },
}))

// Função auxiliar para criar mocks do Sequelize Model
function createMockMoment(data: { id: string | null, created_at: Date, visible: boolean, blocked: boolean }): Model {
    return {
        ...data,
        _attributes: data,
        dataValues: data,
        _creationAttributes: data,
        isNewRecord: false,
        toJSON: () => data,
    } as unknown as Model
}

describe("cold_start_algorithm", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock para console.log e console.error para reduzir ruído nos testes
        vi.spyOn(console, "log").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
        vi.spyOn(console, "warn").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it("deve retornar momentos recentes quando encontrados", async () => {
        const mockMoments = [
            createMockMoment({ id: "123456789", created_at: new Date(), visible: true, blocked: false }),
            createMockMoment({ id: "987654321", created_at: new Date(), visible: true, blocked: false }),
            createMockMoment({ id: "456789123", created_at: new Date(), visible: true, blocked: false }),
        ]

        vi.mocked(Moment.findAll).mockResolvedValueOnce(mockMoments)

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(1)
        expect(Moment.findAll).toHaveBeenCalledWith(expect.objectContaining({
            attributes: ['id', 'created_at', 'visible', 'blocked'],
            where: expect.objectContaining({
                visible: true,
                blocked: false,
                deleted: false
            }),
            order: [['created_at', 'DESC']],
            limit: 100
        }))
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
        expect(result.every(id => typeof id === "bigint")).toBe(true)
        expect(result.map(id => id.toString())).toEqual([
            "123456789",
            "987654321",
            "456789123"
        ])
    })

    it("deve chamar o fallback quando não há momentos suficientes", async () => {
        // Primeira chamada retorna poucos momentos
        vi.mocked(Moment.findAll).mockResolvedValueOnce([
            createMockMoment({ id: "123", created_at: new Date(), visible: true, blocked: false }),
            createMockMoment({ id: "456", created_at: new Date(), visible: true, blocked: false }),
        ])

        // Segunda chamada (fallback) retorna mais momentos
        vi.mocked(Moment.findAll).mockResolvedValueOnce([
            createMockMoment({ id: "789", created_at: new Date(), visible: true, blocked: false }),
            createMockMoment({ id: "012", created_at: new Date(), visible: true, blocked: false }),
            createMockMoment({ id: "345", created_at: new Date(), visible: true, blocked: false }),
        ])

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(2)
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
        expect(result.every(id => typeof id === "bigint")).toBe(true)
    })

    it("deve retornar array vazio quando não há momentos", async () => {
        vi.mocked(Moment.findAll).mockResolvedValueOnce([])

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result).toHaveLength(0)
    })

    it("deve filtrar momentos com IDs inválidos", async () => {
        const mockMoments = [
            createMockMoment({ id: "123456789", created_at: new Date(), visible: true, blocked: false }),
            createMockMoment({ id: null, created_at: new Date(), visible: true, blocked: false }),
            createMockMoment({ id: "invalid", created_at: new Date(), visible: true, blocked: false }),
            createMockMoment({ id: "987654321", created_at: new Date(), visible: true, blocked: false }),
        ]

        vi.mocked(Moment.findAll).mockResolvedValueOnce(mockMoments)

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(2)
        expect(result.map(id => id.toString())).toEqual([
            "123456789",
            "987654321"
        ])
    })

    it("deve lidar com erros nas consultas", async () => {
        vi.mocked(Moment.findAll).mockRejectedValueOnce(new Error("Erro de banco de dados"))

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result).toHaveLength(0)
    })

    it("deve manter a ordem dos momentos por data de criação", async () => {
        const now = new Date()
        const mockMoments = [
            createMockMoment({ id: "3", created_at: new Date(now.getTime() - 1000), visible: true, blocked: false }),
            createMockMoment({ id: "1", created_at: new Date(now.getTime() - 3000), visible: true, blocked: false }),
            createMockMoment({ id: "2", created_at: new Date(now.getTime() - 2000), visible: true, blocked: false }),
        ]

        vi.mocked(Moment.findAll).mockResolvedValueOnce(mockMoments)

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
        expect(result.map(id => id.toString())).toEqual(["3", "1", "2"])
    })
})
