import { EmbeddingVector } from "../../types"

export interface IEmbeddingBuilder<T> {
    build(data: T): Promise<EmbeddingVector>
    update(currentEmbedding: EmbeddingVector, newData: Partial<T>): Promise<EmbeddingVector>
    validate(data: T): boolean
} 