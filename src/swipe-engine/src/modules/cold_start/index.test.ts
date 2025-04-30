import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import cold_start_algorithm from "./index"

// Mock o módulo database para impedir a inicialização global
vi.mock("../../../../database/index.js", () => {
    return {
        connection: {
            authenticate: vi.fn().mockResolvedValue(undefined),
            models: {},
            sync: vi.fn().mockResolvedValue(undefined),
        },
    }
})

// Mock dos modelos com funções mockadas
const mockFindAll = vi.fn()

vi.mock("@models/moments/moment-model", () => {
    return {
        default: {
            findAll: mockFindAll,
            initialize: vi.fn(),
            associate: vi.fn(),
            name: "Moment",
            prototype: {},
            isSequelizeModel: true,
        },
    }
})

vi.mock("@models/moments/moment_interaction-model", () => {
    return {
        default: {
            findAll: vi.fn(),
            initialize: vi.fn(),
            associate: vi.fn(),
            name: "MomentInteraction",
            prototype: {},
            isSequelizeModel: true,
        },
    }
})

// Importar os mocks após declarar o vi.mock
import MomentInteraction from "@models/moments/moment_interaction-model"

// Helper para criar mock objects que se parecem com modelos Sequelize
const createMockModel = (data: any) => ({
    ...data,
    toJSON: () => data,
    get: (key: string) => data[key],
    dataValues: data,
})

describe("cold_start_algorithm", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFindAll.mockReset() // Reset específico para o mock do findAll
        // Mock para console.log e console.error para reduzir ruído nos testes
        vi.spyOn(console, "log").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it("deve retornar momentos populares quando encontrados", async () => {
        const mockMoments = [
            createMockModel({ id: 1 }),
            createMockModel({ id: 2 }),
            createMockModel({ id: 3 }),
        ]

        const mockInteractions = [
            createMockModel({ positive_interaction_rate: 0.8 }),
            createMockModel({ positive_interaction_rate: 0.6 }),
        ]

        mockFindAll.mockResolvedValueOnce(mockMoments)
        vi.mocked(MomentInteraction.findAll).mockResolvedValue(mockInteractions)

        const result = await cold_start_algorithm()

        expect(mockFindAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeLessThanOrEqual(10)
        expect(result.every((id) => typeof id === "number")).toBe(true)
    })

    it("deve chamar o fallback quando não há momentos suficientes", async () => {
        // Primeiro findAll retorna poucos momentos
        mockFindAll.mockResolvedValueOnce([createMockModel({ id: 1 }), createMockModel({ id: 2 })])

        // Segundo findAll (fallback) retorna mais momentos
        mockFindAll.mockResolvedValueOnce([
            createMockModel({ id: 3 }),
            createMockModel({ id: 4 }),
            createMockModel({ id: 5 }),
        ])

        vi.mocked(MomentInteraction.findAll).mockResolvedValue([
            createMockModel({ positive_interaction_rate: 0.7 }),
        ])

        const result = await cold_start_algorithm()

        expect(mockFindAll).toHaveBeenCalledTimes(2)
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
    })

    it("deve retornar array vazio quando não há momentos", async () => {
        mockFindAll.mockResolvedValue([])

        const result = await cold_start_algorithm()

        expect(mockFindAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result).toHaveLength(0)
    })

    it("deve lidar com momentos sem interações", async () => {
        mockFindAll.mockResolvedValueOnce([
            createMockModel({ id: 1 }),
            createMockModel({ id: 2 }),
            createMockModel({ id: 3 }),
        ])

        vi.mocked(MomentInteraction.findAll).mockResolvedValue([])

        const result = await cold_start_algorithm()

        expect(mockFindAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
    })

    it("deve lidar com erros nas consultas", async () => {
        mockFindAll.mockRejectedValue(new Error("Erro de banco de dados"))

        const result = await cold_start_algorithm()

        expect(mockFindAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result).toHaveLength(0)
    })
})
