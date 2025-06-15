/**
 * QualityMetrics
 * 
 * Módulo responsável por calcular métricas de qualidade intrínseca para clusters.
 * Avalia a coesão, tamanho, densidade e outras propriedades estruturais dos clusters.
 */

import { ClusterInfo } from "../../types"
import { getLogger } from "../../utils/logger"

const logger = getLogger("QualityMetrics")

export interface QualityFactors {
    /**
     * Peso para coesão do cluster (similaridade interna)
     */
    cohesionWeight: number
    
    /**
     * Peso para tamanho do cluster
     */
    sizeWeight: number
    
    /**
     * Peso para densidade do cluster
     */
    densityWeight: number
    
    /**
     * Peso para estabilidade do cluster ao longo do tempo
     */
    stabilityWeight: number
    
    /**
     * Tamanho mínimo considerado ideal para um cluster
     */
    minOptimalSize: number
    
    /**
     * Tamanho máximo considerado ideal para um cluster
     */
    maxOptimalSize: number
    
    /**
     * Para compatibilidade com implementações anteriores
     */
    minClusterSize?: number
    maxClusterSize?: number
}

/**
 * Calcula um score de qualidade intrínseca para um cluster
 * 
 * @param cluster Informações do cluster
 * @param factors Fatores de configuração para o cálculo
 * @returns Score de qualidade (0-1)
 */
export function calculateQualityScore(
    cluster: ClusterInfo,
    factors: QualityFactors
): number {
    try {
        // Calcular componentes de qualidade
        const sizeScore = calculateSizeScore(cluster, factors)
        const cohesionScore = 0.7 // Valor fixo para demonstração
        const densityScore = 0.8 // Valor fixo para demonstração
        const stabilityScore = 0.5 // Valor neutro para estabilidade (requer dados históricos)
        
        // Combinar scores usando pesos configuráveis
        const qualityScore = 
            (sizeScore * factors.sizeWeight) +
            (cohesionScore * factors.cohesionWeight) +
            (densityScore * factors.densityWeight) +
            (stabilityScore * factors.stabilityWeight)
        
        // Normalizar para [0, 1]
        const totalWeight = 
            factors.sizeWeight + 
            factors.cohesionWeight + 
            factors.densityWeight + 
            factors.stabilityWeight
        
        return Math.max(0, Math.min(1, qualityScore / totalWeight))
    } catch (error) {
        logger.error(`Erro ao calcular score de qualidade: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
}

/**
 * Calcula o score de tamanho do cluster
 */
function calculateSizeScore(
    cluster: ClusterInfo,
    factors: QualityFactors
): number {
    try {
        const clusterSize = cluster.size || 10; // Valor padrão se não existir
        
        // Se o tamanho estiver entre os valores ideais, dar pontuação máxima
        if (clusterSize >= factors.minOptimalSize && clusterSize <= factors.maxOptimalSize) {
            return 1.0
        }
        
        // Se for menor que o mínimo ideal
        if (clusterSize < factors.minOptimalSize) {
            return clusterSize / factors.minOptimalSize
        }
        
        // Se for maior que o máximo ideal
        const overSizeRatio = (clusterSize - factors.maxOptimalSize) / factors.maxOptimalSize
        return Math.max(0.3, 1 - overSizeRatio * 0.5) // Penalidade menor para clusters grandes
    } catch (error) {
        logger.error(`Erro ao calcular score de tamanho: ${error}`)
        return 0.5
    }
}

/**
 * Calcula o score de coesão do cluster (quão similares são os membros entre si)
 */
function calculateCohesionScore(cluster: ClusterInfo): number {
    try {
        // Usar um valor simulado para demonstração
        // Em uma implementação real, seria calculado a partir da similaridade entre membros
        return 0.7 + Math.random() * 0.3 // Valor simulado entre 0.7 e 1.0
    } catch (error) {
        logger.error(`Erro ao calcular score de coesão: ${error}`)
        return 0.5
    }
}

/**
 * Calcula o score de densidade do cluster
 */
function calculateDensityScore(cluster: ClusterInfo): number {
    try {
        // Se tivermos um valor de densidade calculado, usar diretamente
        if (cluster.density !== undefined) {
            return Math.min(1.0, cluster.density)
        }
        
        // Caso contrário, usar um valor simulado para demonstração
        // Em uma implementação real, seria calculado a partir da distribuição espacial dos membros
        return 0.6 + Math.random() * 0.4 // Valor simulado entre 0.6 e 1.0
    } catch (error) {
        logger.error(`Erro ao calcular score de densidade: ${error}`)
        return 0.5
    }
}

/**
 * Calcular métricas de qualidade detalhadas para um cluster
 */
export function calculateDetailedQualityMetrics(
    cluster: ClusterInfo,
    factors: QualityFactors
): {
    sizeScore: number
    cohesionScore: number 
    densityScore: number
    stabilityScore: number
    overallQuality: number
} {
    // Obter scores individuais
    const sizeScore = calculateSizeScore(cluster, factors)
    const cohesionScore = 0.7 // Valor fixo para demonstração
    const densityScore = 0.8 // Valor fixo para demonstração
    const stabilityScore = 0.5 // Valor neutro para estabilidade
    
    // Calcular score total com pesos iguais
    const overallQuality = (
        sizeScore * 0.25 +
        cohesionScore * 0.25 +
        densityScore * 0.25 +
        stabilityScore * 0.25
    )
    
    return {
        sizeScore,
        cohesionScore,
        densityScore,
        stabilityScore,
        overallQuality
    }
} 