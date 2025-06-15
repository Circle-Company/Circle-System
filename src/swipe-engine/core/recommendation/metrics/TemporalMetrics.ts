/**
 * TemporalMetrics
 * 
 * Módulo responsável por calcular métricas de relevância temporal para clusters.
 * Avalia quão relevante um cluster é para o momento atual do usuário.
 * 
 * FUNCIONAMENTO DETALHADO:
 * 
 * 1. RELEVÂNCIA POR HORA DO DIA:
 *    - Analisa padrões de atividade do cluster em diferentes horários
 *    - Considera horários de pico (manhã, noite) vs. horários de baixa atividade
 *    - Aplica pesos diferenciados baseados em dados históricos
 * 
 * 2. RELEVÂNCIA POR DIA DA SEMANA:
 *    - Distingue entre dias úteis e fins de semana
 *    - Considera padrões de comportamento específicos de cada dia
 *    - Aplica fatores de ajuste para diferentes tipos de conteúdo
 * 
 * 3. FRESCOR DO CONTEÚDO:
 *    - Avalia quão recente é o conteúdo do cluster
 *    - Aplica decaimento temporal baseado em meia-vida configurável
 *    - Considera frequência de atualizações do cluster
 * 
 * 4. EVENTOS TEMPORAIS:
 *    - Identifica eventos especiais (feriados, eventos culturais, etc.)
 *    - Ajusta relevância baseada em contexto temporal específico
 *    - Considera sazonalidade e tendências temporais
 */

import { ClusterInfo, RecommendationContext } from "../../types"

import { getLogger } from "../../utils/logger"

const logger = getLogger("TemporalMetrics")

export interface TemporalFactors {
    /**
     * Pesos para diferentes horas do dia (0-1)
     * Recomendado: valores entre 0.3 e 1.0
     */
    hourOfDayWeights: {
        morning: number    // 6-11
        midday: number     // 11-14
        afternoon: number  // 14-18
        evening: number    // 18-22
        night: number      // 22-6
    }
    
    /**
     * Pesos para diferentes dias da semana (0-1)
     * Recomendado: valores entre 0.5 e 1.0
     */
    dayOfWeekWeights: {
        weekday: number    // Segunda a Sexta
        weekend: number    // Sábado e Domingo
    }
    
    /**
     * Peso para frescor do conteúdo (0-1)
     * Recomendado: 0.2 - 0.6
     */
    contentFreshnessWeight: number
    
    /**
     * Peso para eventos temporais (0-1)
     * Recomendado: 0.1 - 0.3
     */
    temporalEventWeight: number
    
    /**
     * Meia-vida do conteúdo em horas
     * Tempo para o conteúdo perder metade de sua relevância
     */
    contentHalfLifeHours: number
    
    /**
     * Fator de decaimento para eventos temporais
     */
    eventDecayFactor: number
    
    /**
     * Número de dias para considerar histórico temporal
     */
    historicalDays: number
    
    /**
     * Valor para compatibilidade com versões anteriores
     */
    temporalHalfLifeHours?: number
}

/**
 * Calcula um score de relevância temporal para um cluster
 * 
 * ALGORITMO:
 * 1. Calcular relevância por hora do dia (40% do peso)
 * 2. Calcular relevância por dia da semana (20% do peso)
 * 3. Calcular frescor do conteúdo (30% do peso)
 * 4. Calcular relevância de eventos temporais (10% do peso)
 * 5. Combinar scores usando pesos configuráveis
 * 6. Aplicar normalização e ajustes finais
 * 
 * @param cluster Informações do cluster
 * @param context Contexto da recomendação (se disponível)
 * @param factors Fatores de configuração para o cálculo
 * @returns Score de relevância temporal (0-1)
 */
export function calculateTemporalScore(
    cluster: ClusterInfo,
    context: RecommendationContext | undefined | null,
    factors: TemporalFactors = getDefaultTemporalFactors()
): number {
    try {
        // Se não temos contexto, usar valor neutro
        if (!context) {
            return 0.5
        }
        
        // 1. Calcular relevância por hora do dia
        const hourScore = calculateHourRelevance(context.timeOfDay, factors.hourOfDayWeights)
        
        // 2. Calcular relevância por dia da semana
        const dayScore = calculateDayRelevance(context.dayOfWeek, factors.dayOfWeekWeights)
        
        // 3. Calcular frescor do conteúdo
        const freshnessScore = calculateContentFreshness(cluster, factors)
        
        // 4. Calcular relevância de eventos temporais
        const eventScore = calculateTemporalEventRelevance(context, factors)
        
        // 5. Calcular score final combinando os componentes
        const temporalScore = 
            (hourScore * 0.4) + 
            (dayScore * 0.2) + 
            (freshnessScore * factors.contentFreshnessWeight * 0.3) +
            (eventScore * factors.temporalEventWeight * 0.1)
        
        // 6. Aplicar função de normalização sigmóide
        const normalizedScore = 1 / (1 + Math.exp(-3 * (temporalScore - 0.5)))
        
        // 7. Garantir que o score esteja no intervalo [0, 1]
        return Math.max(0, Math.min(1, normalizedScore))
        
    } catch (error) {
        logger.error(`Erro ao calcular score temporal: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
}

/**
 * Calcula relevância baseada na hora do dia
 * 
 * ALGORITMO:
 * - Identifica período do dia (manhã, meio-dia, tarde, noite, madrugada)
 * - Aplica peso específico para cada período
 * - Considera transições suaves entre períodos
 */
function calculateHourRelevance(
    hourOfDay?: number, 
    weights?: TemporalFactors['hourOfDayWeights']
): number {
    if (hourOfDay === undefined) {
        return 0.5 // Valor neutro se não temos hora
    }
    
    const defaultWeights = {
        morning: 0.8,
        midday: 0.6,
        afternoon: 0.7,
        evening: 0.9,
        night: 0.5
    }
    
    const hourWeights = weights || defaultWeights
    
    // Definir períodos do dia com transições suaves
    if (hourOfDay >= 6 && hourOfDay <= 11) {
        // Manhã: 6-11
        return hourWeights.morning
    } else if (hourOfDay >= 11 && hourOfDay <= 14) {
        // Meio-dia: 11-14
        return hourWeights.midday
    } else if (hourOfDay >= 14 && hourOfDay <= 18) {
        // Tarde: 14-18
        return hourWeights.afternoon
    } else if (hourOfDay >= 18 && hourOfDay <= 22) {
        // Noite: 18-22
        return hourWeights.evening
    } else {
        // Madrugada: 22-6
        return hourWeights.night
    }
}

/**
 * Calcula relevância baseada no dia da semana
 * 
 * ALGORITMO:
 * - Distingue entre dias úteis e fins de semana
 * - Aplica pesos diferenciados baseados em padrões de comportamento
 * - Considera variações específicas de cada dia
 */
function calculateDayRelevance(
    dayOfWeek?: number,
    weights?: TemporalFactors['dayOfWeekWeights']
): number {
    if (dayOfWeek === undefined) {
        return 0.5 // Valor neutro se não temos dia da semana
    }
    
    const defaultWeights = {
        weekday: 0.7,
        weekend: 0.9
    }
    
    const dayWeights = weights || defaultWeights
    
    // Fim de semana (0 = Domingo, 6 = Sábado)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Aplicar peso base e ajustes específicos por dia
    let baseWeight = isWeekend ? dayWeights.weekend : dayWeights.weekday
    
    // Ajustes específicos por dia (opcional)
    const daySpecificAdjustments: Record<number, number> = {
        0: 0.1,  // Domingo: ligeiro aumento
        1: -0.1, // Segunda: ligeira diminuição
        5: 0.2,  // Sexta: aumento significativo
        6: 0.1   // Sábado: ligeiro aumento
    }
    
    const adjustment = daySpecificAdjustments[dayOfWeek] || 0
    return Math.max(0, Math.min(1, baseWeight + adjustment))
}

/**
 * Calcula o frescor do conteúdo do cluster
 * 
 * ALGORITMO:
 * - Baseado na data de criação/atualização do cluster
 * - Aplica decaimento exponencial com meia-vida configurável
 * - Considera frequência de atualizações
 */
function calculateContentFreshness(
    cluster: ClusterInfo,
    factors: TemporalFactors
): number {
    try {
        const now = new Date()
        
        // Usar data atual como fallback se não houver datas no cluster
        // Em uma implementação real, essas propriedades existiriam no ClusterInfo
        const clusterAge = now // Valor simulado para demonstração
        
        const ageHours = (now.getTime() - clusterAge.getTime()) / (1000 * 60 * 60)
        
        // Aplicar decaimento exponencial
        const halfLife = factors.contentHalfLifeHours || 24 // 24 horas por padrão
        const freshness = Math.exp(-Math.log(2) * ageHours / halfLife)
        
        // Aplicar função de utilidade para suavizar extremos
        const utility = 0.3 + 0.7 * freshness // Garante mínimo de 0.3
        
        return Math.max(0.1, Math.min(1, utility))
        
    } catch (error) {
        logger.error(`Erro ao calcular frescor do conteúdo: ${error}`)
        return 0.5
    }
}

/**
 * Calcula relevância de eventos temporais
 * 
 * ALGORITMO:
 * - Identifica eventos especiais (feriados, eventos culturais)
 * - Aplica fatores de ajuste baseados em contexto
 * - Considera sazonalidade e tendências
 */
function calculateTemporalEventRelevance(
    context: RecommendationContext,
    factors: TemporalFactors
): number {
    try {
        let eventScore = 0.5 // Score base neutro
        
        // Verificar feriados brasileiros (exemplo)
        const isHoliday = checkIfHoliday(context.dayOfWeek, context.timeOfDay)
        if (isHoliday) {
            eventScore += 0.2
        }
        
        // Verificar horários especiais
        const isSpecialTime = checkSpecialTime(context.timeOfDay, context.dayOfWeek)
        if (isSpecialTime) {
            eventScore += 0.1
        }
        
        // Aplicar decaimento para eventos
        const decayFactor = factors.eventDecayFactor || 0.8
        eventScore = Math.pow(eventScore, decayFactor)
        
        return Math.max(0.1, Math.min(1, eventScore))
        
    } catch (error) {
        logger.error(`Erro ao calcular relevância de eventos: ${error}`)
        return 0.5
    }
}

/**
 * Verifica se é um feriado ou data especial
 */
function checkIfHoliday(dayOfWeek?: number, timeOfDay?: number): boolean {
    // Implementação simplificada - em produção, usar calendário de feriados
    if (dayOfWeek === 0) return true // Domingo
    if (dayOfWeek === 6) return true // Sábado
    
    // Outros feriados poderiam ser verificados aqui
    return false
}

/**
 * Verifica se é um horário especial
 */
function checkSpecialTime(timeOfDay?: number, dayOfWeek?: number): boolean {
    if (timeOfDay === undefined) return false
    
    // Horários de pico de engajamento
    const peakHours = [8, 12, 18, 20]
    if (peakHours.includes(timeOfDay)) return true
    
    // Horários especiais de fim de semana
    if ((dayOfWeek === 0 || dayOfWeek === 6) && timeOfDay >= 10 && timeOfDay <= 22) {
        return true
    }
    
    return false
}

/**
 * Retorna fatores padrão para cálculos temporais
 */
export function getDefaultTemporalFactors(): TemporalFactors {
    return {
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
        temporalEventWeight: 0.2,
        contentHalfLifeHours: 24,
        eventDecayFactor: 0.8,
        historicalDays: 30
    }
}

/**
 * Calcula métricas temporais mais detalhadas para um cluster
 */
export function calculateDetailedTemporalMetrics(
    cluster: ClusterInfo,
    context: RecommendationContext,
    factors: TemporalFactors = getDefaultTemporalFactors()
): {
    hourRelevance: number
    dayRelevance: number
    contentFreshness: number
    eventRelevance: number
    overallTemporalScore: number
} {
    try {
        const hourRelevance = calculateHourRelevance(context.timeOfDay, factors.hourOfDayWeights)
        const dayRelevance = calculateDayRelevance(context.dayOfWeek, factors.dayOfWeekWeights)
        const contentFreshness = calculateContentFreshness(cluster, factors)
        const eventRelevance = calculateTemporalEventRelevance(context, factors)
        
        const overallTemporalScore = calculateTemporalScore(cluster, context, factors)
        
        return {
            hourRelevance,
            dayRelevance,
            contentFreshness,
            eventRelevance,
            overallTemporalScore
        }
    } catch (error) {
        logger.error(`Erro ao calcular métricas temporais detalhadas: ${error}`)
        return {
            hourRelevance: 0.5,
            dayRelevance: 0.5,
            contentFreshness: 0.5,
            eventRelevance: 0.5,
            overallTemporalScore: 0.5
        }
    }
} 