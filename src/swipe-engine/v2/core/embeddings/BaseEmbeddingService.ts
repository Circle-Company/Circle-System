/**
 * Classe base abstrata para serviços de embedding
 */

import { EmbeddingVector } from "../types"

export abstract class BaseEmbeddingService<TInput, TUpdateData> {
    protected dimension: number
    protected modelPath: string
    protected modelLoaded: boolean = false
    protected model: any // Referência ao modelo de embeddings carregado

    constructor(dimension: number, modelPath: string) {
        this.dimension = dimension
        this.modelPath = modelPath
    }

    // Métodos abstratos que devem ser implementados por classes filhas
    abstract generateEmbedding(input: TInput): Promise<number[]>
    abstract updateEmbedding(currentEmbedding: number[], newData: TUpdateData): Promise<number[]>

    // Métodos comuns para todos os serviços de embedding
    protected async loadModel(): Promise<void> {
        if (!this.modelLoaded) {
            try {
                // Lógica para carregar o modelo (específica para cada implementação)
                this.model = await this.loadModelImplementation()
                this.modelLoaded = true
                console.info(`Modelo de embedding carregado: ${this.modelPath}`)
            } catch (error: any) {
                console.error(`Erro ao carregar modelo de embedding: ${error.message}`)
                throw new Error(`Falha ao carregar modelo de embedding: ${error.message}`)
            }
        }
    }

    protected abstract loadModelImplementation(): Promise<any>

    protected normalize(vector: number[]): number[] {
        // Normalização L2 (euclidiana)
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
        if (magnitude === 0) {
            return new Array(vector.length).fill(0)
        }
        return vector.map((val) => val / magnitude)
    }

    protected validateDimension(vector: number[]): void {
        if (vector.length !== this.dimension) {
            throw new Error(
                `Dimensão inválida: esperado ${this.dimension}, recebido ${vector.length}`
            )
        }
    }

    // Método para criar um objeto EmbeddingVector
    protected createEmbeddingVector(values: number[]): EmbeddingVector {
        this.validateDimension(values)
        return {
            dimension: this.dimension,
            values: [...values],
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    }

    // Método para persistência de embeddings
    protected async saveEmbedding(
        entityId: string | bigint,
        embedding: number[],
        metadata?: Record<string, any>
    ): Promise<void> {
        // Lógica para salvar o embedding no banco de dados
        // Isso pode ser sobrescrito por classes filhas se necessário
        console.log(`Salvando embedding para entidade ${entityId}`)
    }

    // Método para recuperação de embeddings
    protected async getStoredEmbedding(entityId: string | bigint): Promise<number[] | null> {
        // Lógica para recuperar um embedding do banco de dados
        // Isso pode ser sobrescrito por classes filhas se necessário
        console.log(`Buscando embedding para entidade ${entityId}`)
        return null
    }
}
