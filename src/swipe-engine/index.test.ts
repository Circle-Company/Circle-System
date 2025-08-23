import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Importar mocks depois de definir vi.mock
import cold_start_algorithm from "./src/modules/cold_start/index"
import { getMoments } from "./index"

// Mock do cold_start_algorithm
vi.mock("./src/modules/cold_start/index", () => {
    return {
        default: vi.fn(),
    }
})


describe("SwipeEngine.getMoments", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it("deve chamar cold_start_algorithm com parâmetros válidos", async () => {
        // Mock de retorno do cold_start_algorithm
        const mockMoments = [101n, 102n, 103n]
        vi.mocked(cold_start_algorithm).mockResolvedValueOnce(mockMoments)

        const result = await getMoments()
        expect(cold_start_algorithm).toHaveBeenCalledTimes(1)
        expect(result).toEqual(mockMoments)
    })

    it("deve filtrar IDs inválidos do retorno do cold_start", async () => {
        // Mock com alguns valores inválidos
        const mockMoments = [201, null, NaN, 204, undefined, "205", 206]
        vi.mocked(cold_start_algorithm).mockResolvedValueOnce(mockMoments as any)

        const result = await getMoments()

        // Apenas os números válidos devem ser retornados
        expect(result).toEqual([201, 204, 206])
    })

    it("deve lidar com erros do cold_start_algorithm", async () => {
        // Simular erro no cold_start_algorithm
        vi.mocked(cold_start_algorithm).mockRejectedValueOnce(new Error("Erro no algoritmo"))

        const result = await getMoments()

        expect(cold_start_algorithm).toHaveBeenCalledTimes(1)
        expect(result).toEqual([])
    })

    it("deve lidar com retornos não-array do cold_start_algorithm", async () => {
        // Simular retorno inválido (não-array)
        vi.mocked(cold_start_algorithm).mockResolvedValueOnce(null as any)

        const result = await getMoments()

        expect(cold_start_algorithm).toHaveBeenCalledTimes(1)
        expect(result).toEqual([])
    })

    it("deve lidar com arrays vazios do cold_start_algorithm", async () => {
        // Simular retorno de array vazio
        vi.mocked(cold_start_algorithm).mockResolvedValueOnce([])

        const result = await getMoments()

        expect(cold_start_algorithm).toHaveBeenCalledTimes(1)
        expect(result).toEqual([])
    })
})
