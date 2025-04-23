/**
 * Módulo de clustering do SwipeEngine
 *
 * Implementação baseada no algoritmo DBSCAN para clustering
 */

import { ClusteringResult, ClusteringTrainingData, Entity } from "../types"
import { DBSCANClustering, DBSCANConfig } from "./DBSCANClustering"

// Exportamos o algoritmo DBSCAN como a implementação padrão de clustering
export { DBSCANClustering, DBSCANConfig }

// Instância padrão do algoritmo de clustering
export const defaultClusteringAlgorithm = new DBSCANClustering()

/**
 * Função utilitária para obter uma instância de DBSCAN com configurações
 * @returns Instância configurada do algoritmo DBSCAN
 */
export function getClusteringAlgorithm(config?: Partial<DBSCANConfig>): DBSCANClustering {
    return new DBSCANClustering()
}

/**
 * Função de conveniência para executar clustering diretamente
 * @param embeddings Vetores de embedding para agrupar
 * @param entities Entidades correspondentes
 * @param config Configuração opcional
 * @returns Resultado da clusterização
 */
export async function performClustering(
    embeddings: number[][],
    entities: Entity[],
    config?: Partial<DBSCANConfig>
): Promise<ClusteringResult> {
    const algorithm = getClusteringAlgorithm(config)
    return algorithm.cluster(embeddings, entities, config)
}

/**
 * Função para treinar um modelo de clustering com dados existentes
 * @param data Dados de treinamento
 * @param config Configuração opcional
 * @returns Resultado da clusterização
 */
export async function trainClusteringModel(
    data: ClusteringTrainingData,
    config?: Partial<DBSCANConfig>
): Promise<ClusteringResult> {
    const algorithm = getClusteringAlgorithm(config)
    return algorithm.train(data, config)
}
