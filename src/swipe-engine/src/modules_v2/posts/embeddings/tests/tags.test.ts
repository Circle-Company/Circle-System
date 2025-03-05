import { describe, expect, it } from "vitest";
import { getTagsEmbedding } from "../tags";

describe("getTagsEmbedding", () => {
    it("should return a normalized embedding for multiple tags", () => {
        const tags = ["food", "travel", "food"];

        const embedding = getTagsEmbedding(tags);

        // O vetor de embedding deve ter o mesmo tamanho que o número de termos únicos
        expect(embedding).toBeInstanceOf(Array);
        expect(embedding.length).toBeGreaterThan(0);

        // O vetor de embedding deve estar normalizado (soma dos valores deve ser 1)
        const totalWeight = embedding.reduce((acc, val) => acc + val, 0);
        expect(totalWeight).toBeCloseTo(1, 5); // Tolerância de precisão
    });

    it("should return a valid embedding for a single tag", () => {
        const tags = ["food"];

        const embedding = getTagsEmbedding(tags);

        // Deve retornar um vetor de embedding
        expect(embedding).toBeInstanceOf(Array);
        expect(embedding.length).toBeGreaterThan(0);

        // O vetor deve estar normalizado
        const totalWeight = embedding.reduce((acc, val) => acc + val, 0);
        expect(totalWeight).toBeCloseTo(1, 5);
    });

    it("should handle repeated tags correctly", () => {
        const tags = ["food", "food", "food"];

        const embedding = getTagsEmbedding(tags);

        // Deve retornar um vetor de embedding com o tamanho correto
        expect(embedding).toBeInstanceOf(Array);
        expect(embedding.length).toBeGreaterThan(0);

        // Verificar se a soma dos pesos ainda é 1
        const totalWeight = embedding.reduce((acc, val) => acc + val, 0);
        expect(totalWeight).toBeCloseTo(1, 5);
    });

    it("should return an empty embedding for an empty tag list", () => {
        const tags: string[] = [];

        const embedding = getTagsEmbedding(tags);

        // Deve retornar um vetor vazio
        expect(embedding).toEqual([]);
    });

    it("should return an embedding even with unique tags", () => {
        const tags = ["banana", "apple", "orange", "grape"];

        const embedding = getTagsEmbedding(tags);

        // O vetor de embedding deve ser uma lista de números normalizada
        expect(embedding).toBeInstanceOf(Array);
        expect(embedding.length).toBeGreaterThan(0);

        // A soma dos valores no embedding deve ser 1 (normalização)
        const totalWeight = embedding.reduce((acc, val) => acc + val, 0);
        expect(totalWeight).toBeCloseTo(1, 5);
    });
});
