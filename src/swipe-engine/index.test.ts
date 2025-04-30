import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getMoments } from "./index"

// Mock do cold_start_algorithm
vi.mock("./src/modules/cold_start/index", () => {
    return {
        default: vi.fn(),
    }
})

// Importar mocks depois de definir vi.mock
import cold_start_algorithm from "./src/modules/cold_start/index"

describe("SwipeEngine.getMoments", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it("deve chamar cold_start_algorithm com parâmetros válidos", async () => {
        // Mock de retorno do cold_start_algorithm
        const mockMoments = [101, 102, 103]
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
        const mockError = new Error("Erro simulado no algoritmo")
        vi.mocked(cold_start_algorithm).mockRejectedValueOnce(mockError)

        // Esperamos que getMoments capture o erro e lance um InternalServerError
        // ou retorne um array vazio dependendo da implementação real de getMoments.
        // O log de erro indica que um InternalServerError é lançado.
        await expect(getMoments()).rejects.toThrowError(/Erro ao buscar feed de momentos/i)
        // Verifica se o algoritmo foi chamado
        expect(cold_start_algorithm).toHaveBeenCalledTimes(1)

        // Se a intenção fosse retornar [], a asserção seria:
        // const result = await getMoments()
        // expect(result).toEqual([])
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
