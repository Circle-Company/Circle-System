import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import cold_start_algorithm from "./index"

// Mock para o Sequelize e os modelos
vi.mock("@models/moments/moment-model.js", () => {
    return {
        default: {
            findAll: vi.fn(),
        },
    }
})

vi.mock("@models/moments/moment_interaction-model.js", () => {
    return {
        default: {
            findAll: vi.fn(),
        },
    }
})

// Importar os mocks após declarar o vi.mock
import Moment from "@models/moments/moment-model.js"
import MomentInteraction from "@models/moments/moment_interaction-model.js"

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
        // Mock para console.log e console.error para reduzir ruído nos testes
        vi.spyOn(console, "log").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it("deve retornar momentos populares quando encontrados", async () => {
        // Mock de retorno do findAll para momentos
        const mockMoments = [
            createMockModel({ id: 1 }),
            createMockModel({ id: 2 }),
            createMockModel({ id: 3 }),
        ]

        // Mock de retorno do findAll para interações
        const mockInteractions = [
            createMockModel({ positive_interaction_rate: 0.8 }),
            createMockModel({ positive_interaction_rate: 0.6 }),
        ]

        vi.mocked(Moment.findAll).mockResolvedValueOnce(mockMoments as any)
        vi.mocked(MomentInteraction.findAll).mockResolvedValue(mockInteractions as any)

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeLessThanOrEqual(10)
        expect(result.every((id) => typeof id === "number")).toBe(true)
    })

    it("deve chamar o fallback quando não há momentos suficientes", async () => {
        // Primeiro findAll retorna poucos momentos
        vi.mocked(Moment.findAll).mockResolvedValueOnce([
            createMockModel({ id: 1 }),
            createMockModel({ id: 2 }),
        ] as any)

        // Segundo findAll (fallback) retorna mais momentos
        vi.mocked(Moment.findAll).mockResolvedValueOnce([
            createMockModel({ id: 3 }),
            createMockModel({ id: 4 }),
            createMockModel({ id: 5 }),
        ] as any)

        vi.mocked(MomentInteraction.findAll).mockResolvedValue([
            createMockModel({ positive_interaction_rate: 0.7 }),
        ] as any)

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(2)
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
    })

    it("deve retornar array vazio quando não há momentos", async () => {
        vi.mocked(Moment.findAll).mockResolvedValue([])

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result).toHaveLength(0)
    })

    it("deve lidar com momentos sem interações", async () => {
        vi.mocked(Moment.findAll).mockResolvedValueOnce([
            createMockModel({ id: 1 }),
            createMockModel({ id: 2 }),
            createMockModel({ id: 3 }),
        ] as any)

        vi.mocked(MomentInteraction.findAll).mockResolvedValue([])

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
    })

    it("deve lidar com erros nas consultas", async () => {
        vi.mocked(Moment.findAll).mockRejectedValue(new Error("Erro de banco de dados"))

        const result = await cold_start_algorithm()

        expect(Moment.findAll).toHaveBeenCalledTimes(1)
        expect(result).toBeInstanceOf(Array)
        expect(result).toHaveLength(0)
    })
})
