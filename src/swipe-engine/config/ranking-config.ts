/**
 * Configuração do Sistema de Ranqueamento
 * 
 * Este arquivo contém as configurações usadas pelo sistema de ranqueamento de clusters
 * e recomendações. Modificar estes valores permite ajustar o comportamento do sistema
 * sem alterar o código-fonte.
 */

// Configuração do ranqueamento de clusters
export const clusterRankingConfig = {
    /**
     * Pesos base para os diferentes componentes do score
     * Estes valores serão normalizados para somar 1.0
     */
    baseWeights: {
        // Peso para similaridade semântica/afinidade entre usuário e cluster
        affinity: 0.30,
        
        // Peso para métricas de engajamento histórico com o cluster
        engagement: 0.25,
        
        // Peso para novidade (conteúdo que o usuário não viu antes)
        novelty: 0.20,
        
        // Peso para diversidade (diferente do que o usuário normalmente consome)
        diversity: 0.10,
        
        // Peso para relevância temporal (ex: horário do dia, dia da semana)
        temporal: 0.05,
        
        // Peso para qualidade intrínseca do cluster
        quality: 0.10
    },
    
    /**
     * Fatores que influenciam o cálculo de afinidade
     */
    affinityFactors: {
        // Peso para similaridade vetorial direta
        embeddingSimilarityWeight: 0.60,
        
        // Peso para interesses explícitos compartilhados
        sharedInterestsWeight: 0.30,
        
        // Peso para proximidade na rede de interesses
        networkProximityWeight: 0.10
    },
    
    /**
     * Fatores que influenciam o cálculo de engajamento
     */
    engagementFactors: {
        // Configuração de recência para diferentes tipos de interação
        recency: {
            halfLifeHours: {
                view: 48,     // 2 dias
                like: 168,    // 7 dias
                comment: 336, // 14 dias
                share: 336,   // 14 dias
                save: 720     // 30 dias
            }
        },
        
        // Pesos para diferentes tipos de interação
        interactionWeights: {
            view: 1.0,
            like: 2.0,
            comment: 3.0,
            share: 4.0,
            save: 5.0
        },
        
        // Fator de decaimento temporal para engajamento
        timeDecayFactor: 0.9
    },
    
    /**
     * Fatores que influenciam o cálculo de novidade
     */
    noveltyFactors: {
        // Peso para novidade baseada em conteúdo já visto
        viewedContentWeight: 0.7,
        
        // Peso para novidade baseada em tópicos de interesse
        topicNoveltyWeight: 0.3,
        
        // Período de tempo (em dias) a considerar para decaimento de novidade
        noveltyDecayPeriodDays: 30,
        
        // Fator de desconto para conteúdos similares
        similarContentDiscount: 0.5
    },
    
    /**
     * Fatores que influenciam o cálculo de diversidade
     */
    diversityFactors: {
        // Peso para diversidade temática
        topicDiversityWeight: 0.5,
        
        // Peso para diversidade de criadores de conteúdo
        creatorDiversityWeight: 0.3,
        
        // Peso para diversidade de formatos de conteúdo
        formatDiversityWeight: 0.2,
        
        // Número de clusters recentes a considerar para diversidade
        recentClustersToConsider: 10
    },
    
    /**
     * Fatores que influenciam o cálculo de relevância temporal
     */
    temporalFactors: {
        // Pesos para diferentes horas do dia
        hourOfDayWeights: {
            morning: 1.2,    // 6-11
            midday: 1.0,     // 11-14
            afternoon: 0.9,  // 14-18
            evening: 1.3,    // 18-22
            night: 0.8       // 22-6
        },
        
        // Pesos para diferentes dias da semana
        dayOfWeekWeights: {
            weekday: 1.0,    // Segunda a Sexta
            weekend: 1.2     // Sábado e Domingo
        },
        
        // Peso para frescor do conteúdo
        contentFreshnessWeight: 0.7,
        
        // Peso para eventos temporais
        temporalEventWeight: 0.3
    },
    
    /**
     * Fatores que influenciam o cálculo de qualidade
     */
    qualityFactors: {
        // Peso para coesão do cluster (similaridade interna)
        cohesionWeight: 0.4,
        
        // Peso para tamanho do cluster
        sizeWeight: 0.2,
        
        // Peso para densidade do cluster
        densityWeight: 0.2,
        
        // Peso para estabilidade do cluster ao longo do tempo
        stabilityWeight: 0.2,
        
        // Tamanho mínimo considerado ideal para um cluster
        minOptimalSize: 5,
        
        // Tamanho máximo considerado ideal para um cluster
        maxOptimalSize: 50
    },
    
    /**
     * Configurações para diversificação de resultados
     */
    diversification: {
        // Se deve aplicar diversificação nos resultados
        enabled: true,
        
        // Fator de temperatura para diversificação (0-1, maior = mais diverso)
        temperature: 0.3,
        
        // Método de diversificação
        method: "mmr", // Maximum Marginal Relevance
        
        // Lambda para MMR (0-1, maior = mais relevância, menor = mais diversidade)
        mmrLambda: 0.7
    },
    
    /**
     * Configurações para feedback em tempo real
     */
    feedbackSettings: {
        // Se deve considerar feedback em tempo real
        enabled: true,
        
        // Fator de ajuste para feedback positivo
        positiveAdjustment: 0.2,
        
        // Fator de ajuste para feedback negativo
        negativeAdjustment: -0.3
    }
}

// Configuração para personalização por tipo de usuário
export const userTypeConfigs = {
    // Configuração para usuários novos (cold start)
    newUser: {
        // Modificadores de peso para usuários novos
        weightModifiers: {
            affinity: 0.8,     // Reduzir peso de afinidade (não temos dados suficientes)
            engagement: 0.7,    // Reduzir peso de engajamento (não temos histórico)
            novelty: 1.5,       // Aumentar peso de novidade
            diversity: 1.5,     // Aumentar peso de diversidade
            temporal: 1.2,      // Aumentar peso de temporal
            quality: 1.3        // Aumentar peso de qualidade (mostrar conteúdo premium)
        }
    },
    
    // Configuração para usuários muito ativos
    powerUser: {
        // Modificadores de peso para usuários power
        weightModifiers: {
            affinity: 1.2,      // Aumentar peso de afinidade
            engagement: 1.1,     // Aumentar peso de engajamento
            novelty: 1.3,        // Aumentar peso de novidade
            diversity: 1.4,      // Aumentar peso de diversidade
            temporal: 0.8,       // Reduzir peso de temporal
            quality: 1.0         // Manter peso de qualidade
        }
    },
    
    // Configuração para usuários casuais
    casualUser: {
        // Modificadores de peso para usuários casuais
        weightModifiers: {
            affinity: 1.0,      // Manter peso de afinidade
            engagement: 1.2,     // Aumentar peso de engajamento
            novelty: 0.9,        // Reduzir peso de novidade
            diversity: 0.8,      // Reduzir peso de diversidade
            temporal: 1.2,       // Aumentar peso de temporal
            quality: 1.1         // Aumentar peso de qualidade
        }
    }
}

// Configuração do decaimento temporal para diferentes tipos de conteúdo
export const temporalDecayConfig = {
    // Conteúdo relacionado a notícias/atualidades
    news: {
        halfLifeHours: 12,      // Meia-vida de 12 horas
        maxAgeDays: 7           // Idade máxima de 7 dias
    },
    
    // Conteúdo educacional/informativo
    educational: {
        halfLifeHours: 720,     // Meia-vida de 30 dias
        maxAgeDays: 365         // Idade máxima de 1 ano
    },
    
    // Conteúdo de entretenimento
    entertainment: {
        halfLifeHours: 168,     // Meia-vida de 7 dias
        maxAgeDays: 180         // Idade máxima de 6 meses
    },
    
    // Padrão para outros tipos de conteúdo
    default: {
        halfLifeHours: 72,      // Meia-vida de 3 dias
        maxAgeDays: 90          // Idade máxima de 3 meses
    }
} 