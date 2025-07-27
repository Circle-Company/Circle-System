export const EmbeddingParams = {
    timeWindows: {
        recentEmbeddingUpdate: 24 * 60 * 60 * 1000,
        interactionHistory: 30 * 24 * 60 * 60 * 1000,
    },
    dimensions: {
        embedding: 128,
        interactionHistory: 50,
        contentPreferences: 20,
        socialFeatures: 30,
    },
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
    similarity: {
        defaultLimit: 10,
        minimumThreshold: 0.7,
    },
    batchProcessing: {
        size: 100,
    },
    normalization: {
        engagementLogBase: 10,
        engagementScaleFactor: 5,
    },
    decay: {
        interactionWeight: {
            base: 24,
            minimum: 0.1,
        },
    },
    feedback: {
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
        learningRates: {
            user: {
                highPriority: 0.1,
                normal: 0.05,
            },
            post: {
                highPriority: 0.05,
                normal: 0.02,
                networkEffect: 0.005,
            },
        },
        engagement: {
            timeThresholds: {
                short: 5,
                medium: 30,
                long: 60,
            },
            watchPercentages: {
                low: 0.2,
                high: 0.8,
            },
            timeMultipliers: {
                short: 0.5,
                long: 1.5,
            },
            watchMultipliers: {
                low: 0.7,
                high: 1.3,
            },
        },
        networkEffects: {
            similarPostsLimit: 5,
            similarityThreshold: 0.8,
        },
        highPriorityInteractions: [
            "like",
            "share",
            "like_comment",
            "report",
        ],
    },
    candidateSelector: {
        weights: {
            clusterScore: 0.4,
            recency: 0.3,
            engagement: 0.2,
            random: 0.1,
        },
        thresholds: {
            minimumClusterScore: 0.2,
            timeWindow: 24 * 7,
            defaultLimit: 30,
            bufferSize: 5,
        }
    },
}

export const FeedRecommendationParams = {
    defaultOptions: {
        limit: 20,
        diversity: 0.4,
        novelty: 0.3,
        context: {
            timeOfDay: true,
            dayOfWeek: true,
        },
    }
}

export const RankingParams = {
    weights: {
        relevance: 0.4,
        engagement: 0.25,
        novelty: 0.15,
        diversity: 0.1,
        context: 0.1,
    },
    noveltyLevel: 0.3,
    diversityLevel: 0.4,
    decay: {
        interactionWeight: 24,
        minimum: 0.1,
    },
    defaultScores: {
        relevance: 0.5,
        engagement: 0.5,
        novelty: 0.5,
        diversity: 0.5,
        context: 0.5,
    },
    diversityWeights: {
        tags: 0.6,
        engagement: 0.4,
    },
    contextWeights: {
        peakHours: 0.3,
        lowEngagementHours: 0.1,
        normalHours: 0.2,
        weekend: 0.3,
        midWeek: 0.2,
        weekStartEnd: 0.25,
        sameLocation: 0.3,
        differentLocation: 0.1,
    },
    maxTags: 10,
}

export const ClusterRankingParams = {
    engagementFactors: {
        recency: {
            halfLifeHours: {
                partialView: 24,
                completeView: 48,
                like: 168,
                likeComment: 192,
                comment: 336,
                share: 336,
                save: 720
            }
        },
        interactionWeights: {
            partialView: 0.5,
            completeView: 1.0,
            like: 2.0,
            likeComment: 2.5,
            comment: 3.0,
            share: 4.0,
        },
        timeDecayFactor: 0.9,
        maxInteractionsPerUser: 100,
        normalizationFactor: 0.1,
        defaultInteractionWeights: {
            partialView: 0.5,
            completeView: 1.0,
            like: 2.0,
            likeComment: 2.5,
            comment: 3.0,
            share: 4.0,
            save: 3.5,
            dislike: -0.5,
            report: -1.0,
            showLessOften: -0.6,
            click: 0.3,
            default: 0.3
        }
    },
    noveltyFactors: {
        viewedContentWeight: 0.7,
        topicNoveltyWeight: 0.3,
        noveltyDecayPeriodDays: 30,
        similarContentDiscount: 0.5
    },
    diversityFactors: {
        topicDiversityWeight: 0.5,
        creatorDiversityWeight: 0.3,
        formatDiversityWeight: 0.2,
        recentClustersToConsider: 10
    },
    qualityFactors: {
        cohesionWeight: 0.4,
        sizeWeight: 0.2,
        densityWeight: 0.2,
        stabilityWeight: 0.2,
        minOptimalSize: 5,
        maxOptimalSize: 50
    },
    userProfileAdjustments: {
        highInteractionThreshold: 100,
        diversityIncrease: 0.1,
        affinityDecrease: 0.05,
        noveltyIncrease: 0.05
    },
    temporalAdjustments: {
        nightTime: {
            startHour: 20,
            endHour: 5,
            qualityIncrease: 0.1,
            engagementDecrease: 0.05
        },
        lunchTime: {
            startHour: 11,
            endHour: 14,
            temporalIncrease: 0.1,
            engagementDecrease: 0.05
        },
        weekend: {
            days: [0, 6],
            noveltyIncrease: 0.1,
            qualityDecrease: 0.05
        }
    },
    confidence: {
        varianceMultiplier: 2
    },
    statistics: {
        topClustersCount: 5,
        scoreDistributionLimits: {
            low: 0.2,
            medium: 0.4,
            high: 0.6,
            veryHigh: 0.8
        }
    },
    fallback: {
        neutralScore: 0.5,
        errorConfidence: 0.1,
        maxTopicsInMetadata: 5
    }
}

export const clusterRankingConfig = {
    baseWeights: {
        affinity: 0.30,
        engagement: 0.25,
        novelty: 0.20,
        diversity: 0.10,
        temporal: 0.05,
        quality: 0.10
    },
    affinityFactors: {
        embeddingSimilarityWeight: 0.60,
        sharedInterestsWeight: 0.30,
        networkProximityWeight: 0.10
    },
    engagementFactors: {
        recency: {
            halfLifeHours: {
                view: 48,
                like: 168,
                comment: 336,
                share: 336,
                save: 720
            }
        },
        interactionWeights: {
            view: 1.0,
            like: 2.0,
            comment: 3.0,
            share: 4.0,
            save: 5.0
        },
        timeDecayFactor: 0.9
    },
    noveltyFactors: {
        viewedContentWeight: 0.7,
        topicNoveltyWeight: 0.3,
        noveltyDecayPeriodDays: 30,
        similarContentDiscount: 0.5
    },
    diversityFactors: {
        topicDiversityWeight: 0.5,
        creatorDiversityWeight: 0.3,
        formatDiversityWeight: 0.2,
        recentClustersToConsider: 10
    },
    temporalFactors: {
        hourOfDayWeights: {
            morning: 1.2,
            midday: 1.0,
            afternoon: 0.9,
            evening: 1.3,
            night: 0.8
        },
        dayOfWeekWeights: {
            weekday: 1.0,
            weekend: 1.2
        },
        contentFreshnessWeight: 0.7,
        temporalEventWeight: 0.3
    },
    qualityFactors: {
        cohesionWeight: 0.4,
        sizeWeight: 0.2,
        densityWeight: 0.2,
        stabilityWeight: 0.2,
        minOptimalSize: 5,
        maxOptimalSize: 50
    },
    diversification: {
        enabled: true,
        temperature: 0.3,
        method: "mmr",
        mmrLambda: 0.7
    },
    feedbackSettings: {
        enabled: true,
        positiveAdjustment: 0.2,
        negativeAdjustment: -0.3
    }
}

export const userTypeConfigs = {
    newUser: {
        weightModifiers: {
            affinity: 0.8,
            engagement: 0.7,
            novelty: 1.5,
            diversity: 1.5,
            temporal: 1.2,
            quality: 1.3
        }
    },
    powerUser: {
        weightModifiers: {
            affinity: 1.2,
            engagement: 1.1,
            novelty: 1.3,
            diversity: 1.4,
            temporal: 0.8,
            quality: 1.0
        }
    },
    casualUser: {
        weightModifiers: {
            affinity: 1.0,
            engagement: 1.2,
            novelty: 0.9,
            diversity: 0.8,
            temporal: 1.2,
            quality: 1.1
        }
    }
}

export const temporalDecayConfig = {
    news: {
        halfLifeHours: 12,
        maxAgeDays: 7
    },
    educational: {
        halfLifeHours: 720,
        maxAgeDays: 365
    },
    entertainment: {
        halfLifeHours: 168,
        maxAgeDays: 180
    },
    default: {
        halfLifeHours: 72,
        maxAgeDays: 90
    }
}

export const interactionBoosts = {
    clickBoost: 0.2,
    likeBoost: 0.5,
    shareBoost: 0.8,
    completeViewBoost: 1,
    partialViewBoost: 0.2,
    commentBoost: 0.6,
    likeCommentBoost: 0.5,
    reportBoost: -1.0,
    showLessOftenBoost: -0.8,
    defaultBoost: 0.1,
}

export const interactionScore = {
    default: 0.3,
    defaultWhenBoostZero: 0
}