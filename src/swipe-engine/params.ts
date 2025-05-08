export const EmbeddingParams = {
    // Configurações de tempo
    timeWindows: {
        recentEmbeddingUpdate: 24 * 60 * 60 * 1000, // 24 horas
        interactionHistory: 30 * 24 * 60 * 60 * 1000, // 30 dias
    },

    // Configurações de dimensões
    dimensions: {
        embedding: 128,
        interactionHistory: 50,
        contentPreferences: 20,
        socialFeatures: 30,
    },

    // Pesos para componentes do embedding
    weights: {
        content: {
            text: 0.5,
            tags: 0.3,
            engagement: 0.2,
        },
        interactions: {
            view: 0.1,
            like: 0.3,
            comment: 0.5,
            share: 0.7,
            save: 0.6,
            default: 0.2,
        },
        update: {
            default: 0.5,
        },
    },

    // Configurações de similaridade
    similarity: {
        defaultLimit: 10,
        minimumThreshold: 0.7,
    },

    // Configurações de processamento em lote
    batchProcessing: {
        size: 100,
    },

    // Configurações de normalização
    normalization: {
        engagementLogBase: 10,
        engagementScaleFactor: 5,
    },

    // Configurações de decaimento
    decay: {
        interactionWeight: {
            base: 24, // horas
            minimum: 0.1,
        },
    },

    // Configurações de feedback e processamento de interações
    feedback: {
        // Forças de interação
        interactionStrengths: {
            short_view: 0.1,
            long_view: 0.3,
            like: 0.5,
            like_comment: 0.6,
            share: 0.8,
            comment: 0.4,
            dislike: -0.5,
            show_less_often: -0.6,
            report: -0.8,
        },

        // Taxas de aprendizado
        learningRates: {
            user: {
                highPriority: 0.1,    // Para interações de alta prioridade
                normal: 0.05,         // Para processamento em lote
            },
            post: {
                highPriority: 0.05,   // Para posts com interações importantes
                normal: 0.02,         // Para processamento em lote
                networkEffect: 0.005, // Para efeitos de rede
            },
        },

        // Configurações de engajamento
        engagement: {
            timeThresholds: {
                short: 5,    // segundos
                medium: 30,  // segundos
                long: 60,    // segundos
            },
            watchPercentages: {
                low: 0.2,    // 20%
                high: 0.8,   // 80%
            },
            timeMultipliers: {
                short: 0.5,  // Reduz força para engajamento curto
                long: 1.5,   // Aumenta força para engajamento longo
            },
            watchMultipliers: {
                low: 0.7,    // Reduz força para assistência baixa
                high: 1.3,   // Aumenta força para assistência alta
            },
        },

        // Configurações de efeitos de rede
        networkEffects: {
            similarPostsLimit: 5,
            similarityThreshold: 0.8,
        },

        // Tipos de interação de alta prioridade
        highPriorityInteractions: [
            "like",
            "share",
            "like_comment",
            "report",
        ],
    },
}