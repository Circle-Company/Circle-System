/**
 * Exportação simplificada do sistema de clustering
 * Utilizando apenas o algoritmo KMeans como implementação padrão
 */

import { KMeansClustering } from "./KMeansClustering"

// Exportamos o algoritmo KMeans como a implementação padrão de clustering
export { KMeansClustering }

// Exportamos uma instância pronta para uso
export const defaultClusteringAlgorithm = new KMeansClustering()

/**
 * Função utilitária para obter uma instância de KMeans com configurações
 * @returns Instância configurada do algoritmo KMeans
 */
export function getClusteringAlgorithm(): KMeansClustering {
    return new KMeansClustering()
}
