/**
 * Módulo de clustering do SwipeEngine
 *
 * Implementação baseada no algoritmo DBSCAN para clustering
 */

import { DBSCANClustering } from "./DBSCANClustering"
import { Entity } from "../types"

// Exporta a classe DBSCAN como implementação padrão
export { DBSCANClustering }

// Instância padrão do algoritmo
export const defaultClusteringAlgorithm = new DBSCANClustering()

/**
 * Função de conveniência para executar clustering diretamente
 */
export async function performClustering(
    embeddings: number[][],
    entities: Entity[],
): Promise<{
    clusters: Array<{
        id: string,
        centroid: number[],
        members: string[],
        entities: Entity[],
        size: number,
        density?: number,
        memberIds?: string[]
    }>,
    assignments: Record<string, number>
}> {
    const algorithm = new DBSCANClustering()
    return algorithm.cluster(embeddings, entities)
}
