/**
 * TemporalMetrics
 * 
 * Módulo responsável por calcular métricas de relevância temporal para clusters.
 * Avalia quão relevante um cluster é para o momento atual do usuário.
 */

import { ClusterInfo, RecommendationContext } from "../../types"

import { getLogger } from "../../utils/logger"

const logger = getLogger("TemporalMetrics")

export interface TemporalFactors {
    /**
     * Pesos para diferentes horas do dia
     */
    hourOfDayWeights: {
        morning: number  // 6-11
        midday: number   // 11-14
        afternoon: number // 14-18
        evening: number  // 18-22
        night: number    // 22-6
    }
    
    /**
     * Pesos para diferentes dias da semana
     */
    dayOfWeekWeights: {
        weekday: number  // Segunda a Sexta
        weekend: number  // Sábado e Domingo
    }
    
    /**
     * Peso para frescor do conteúdo
     */
    contentFreshnessWeight: number
    
    /**
     * Peso para eventos temporais
     */
    temporalEventWeight: number
    
    /**
     * Valor para compatibilidade com versões anteriores
     */
    temporalHalfLifeHours?: number
}

/**
 * Calcula um score de relevância temporal para um cluster
 * 
 * @param cluster Informações do cluster
 * @param context Contexto da recomendação (se disponível)
 * @param factors Fatores de configuração para o cálculo
 * @returns Score de relevância temporal (0-1)
 */
export function calculateTemporalScore(
    cluster: ClusterInfo,
    context: RecommendationContext | undefined | null,
    factors: TemporalFactors
): number {
    try {
        // Se não temos contexto, usar valor neutro
        if (!context) {
            return 0.5
        }
        
        // Calcular relevância por hora do dia
        const hourScore = calculateHourRelevance(context.timeOfDay)
        
        // Calcular relevância por dia da semana
        const dayScore = calculateDayRelevance(context.dayOfWeek)
        
        // Frescor simulado (normalmente baseado em criação/atualização)
        const freshnessScore = Math.random() * 0.5 + 0.5
        
        // Calcular score final combinando os componentes
        const temporalScore = 
            (hourScore * 0.4) + 
            (dayScore * 0.2) + 
            (freshnessScore * factors.contentFreshnessWeight * 0.4)
        
        return Math.max(0, Math.min(1, temporalScore))
    } catch (error) {
        logger.error(`Erro ao calcular score temporal: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
}

/**
 * Calcula relevância baseada na hora do dia
 */
function calculateHourRelevance(hourOfDay?: number): number {
    if (hourOfDay === undefined) {
        return 0.5 // Valor neutro se não temos hora
    }
    
    // Lógica simplificada para relevância temporal
    // Manhã (6-9) e noite (18-22) são horários de pico
    if ((hourOfDay >= 6 && hourOfDay <= 9) || (hourOfDay >= 18 && hourOfDay <= 22)) {
        return 0.9
    } 
    // Meio-dia também tem relevância moderada
    else if (hourOfDay >= 11 && hourOfDay <= 14) {
        return 0.7
    }
    // Madrugada tem menor relevância
    else if (hourOfDay >= 0 && hourOfDay <= 5) {
        return 0.3
    }
    // Outros horários têm relevância média
    else {
        return 0.5
    }
}

/**
 * Calcula relevância baseada no dia da semana
 */
function calculateDayRelevance(dayOfWeek?: number): number {
    if (dayOfWeek === undefined) {
        return 0.5 // Valor neutro se não temos dia da semana
    }
    
    // Fim de semana tem maior relevância para conteúdo de lazer
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    return isWeekend ? 0.8 : 0.6
}

/**
 * Calcula métricas temporais mais detalhadas para um cluster
 */
export function calculateDetailedTemporalMetrics(
    cluster: ClusterInfo,
    context: RecommendationContext
): {
    hourRelevance: number
    dayRelevance: number
    recencyFactor: number
    overallTemporalScore: number
} {
    try {
        // Fatores padrão para cálculos
        const defaultFactors: TemporalFactors = {
            hourOfDayWeights: {
                morning: 0.8,
                midday: 0.6,
                afternoon: 0.7,
                evening: 0.9,
                night: 0.5
            },
            dayOfWeekWeights: {
                weekday: 0.7,
                weekend: 0.9
            },
            contentFreshnessWeight: 0.4,
            temporalEventWeight: 0.2
        }
        
        let hourRelevance = 0.5
        let dayRelevance = 0.5
        
        // Calcular relevância por hora do dia
        if (context.timeOfDay !== undefined) {
            hourRelevance = calculateHourRelevance(context.timeOfDay)
        }
        
        // Calcular relevância por dia da semana
        if (context.dayOfWeek !== undefined) {
            dayRelevance = calculateDayRelevance(context.dayOfWeek)
        }
        
        // Calcular frescor do conteúdo
        const freshnessScore = Math.random() * 0.5 + 0.5
        
        // Calcular fator de recência (simulado - normalmente seria baseado em criação/atualização)
        const recencyFactor = 0.8 // Valor fixo para exemplo
        
        // Combinar em score geral
        const overallTemporalScore = (
            hourRelevance * 0.4 +
            dayRelevance * 0.2 +
            freshnessScore * defaultFactors.contentFreshnessWeight * 0.4 +
            recencyFactor * 0.4
        )
        
        return {
            hourRelevance,
            dayRelevance,
            recencyFactor,
            overallTemporalScore
        }
    } catch (error) {
        logger.error(`Erro ao calcular métricas temporais detalhadas: ${error}`)
        return {
            hourRelevance: 0.5,
            dayRelevance: 0.5,
            recencyFactor: 0.5,
            overallTemporalScore: 0.5
        }
    }
} 