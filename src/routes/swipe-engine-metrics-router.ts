import {
    getClusterMetrics,
    getClusterRankingMetrics,
    getComprehensiveReport,
    getEmbeddingMetrics,
    getPerformanceMetrics,
    getRecommendationQualityMetrics,
    getSystemMetrics,
    getTemporalTrends,
    getUserInteractionMetrics
} from '../controllers/swipe-engine'

import { Router } from 'express'

export const router = Router()

/**
 * Rotas para análise de métricas da Swipe Engine
 * 
 * Prefixo: /api/swipe-engine/metrics
 * 
 * Endpoints disponíveis:
 * - GET /system - Métricas gerais do sistema
 * - GET /clusters - Métricas de clusters
 * - GET /embeddings - Métricas de embeddings
 * - GET /ranking - Métricas de ranking de clusters
 * - GET /interactions/:userId - Métricas de interações do usuário
 * - GET /performance - Métricas de performance do sistema
 * - GET /quality - Métricas de qualidade das recomendações
 * - GET /trends - Tendências temporais
 * - GET /report - Relatório completo de métricas
 */

/**
 * GET /api/swipe-engine/metrics/system
 * Obtém estatísticas gerais do sistema de recomendação
 * 
 * Query Parameters:
 * - period: string (opcional) - Período de análise ('1h', '24h', '7d', '30d')
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalUsers": number,
 *     "totalPosts": number,
 *     "totalClusters": number,
 *     "activeEmbeddings": number,
 *     "lastUpdate": Date,
 *     "systemHealth": string,
 *     "performance": {
 *       "averageResponseTime": number,
 *       "requestsPerMinute": number,
 *       "errorRate": number
 *     }
 *   },
 *   "timestamp": Date
 * }
 */
router.get('/system', getSystemMetrics)

/**
 * GET /api/swipe-engine/metrics/clusters
 * Obtém estatísticas de clusters
 * 
 * Query Parameters:
 * - limit: number (opcional, padrão: 10) - Limite de resultados
 * - offset: number (opcional, padrão: 0) - Offset para paginação
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalClusters": number,
 *     "averageClusterSize": number,
 *     "clusterDistribution": {
 *       "small": number,
 *       "medium": number,
 *       "large": number
 *     },
 *     "topClusters": Array,
 *     "recentActivity": {
 *       "clustersCreated": number,
 *       "clustersUpdated": number,
 *       "lastUpdate": Date
 *     }
 *   },
 *   "pagination": {
 *     "limit": number,
 *     "offset": number,
 *     "total": number
 *   }
 * }
 */
router.get('/clusters', getClusterMetrics)

/**
 * GET /api/swipe-engine/metrics/embeddings
 * Obtém estatísticas de embeddings
 * 
 * Query Parameters:
 * - type: string (opcional, padrão: 'all') - Tipo de embedding ('user', 'post', 'all')
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "userEmbeddings": {
 *       "total": number,
 *       "active": number,
 *       "lastUpdated": Date,
 *       "averageDimension": number,
 *       "updateFrequency": number
 *     },
 *     "postEmbeddings": {
 *       "total": number,
 *       "active": number,
 *       "lastUpdated": Date,
 *       "averageDimension": number,
 *       "updateFrequency": number
 *     },
 *     "modelPerformance": {
 *       "averageGenerationTime": number,
 *       "cacheHitRate": number,
 *       "modelVersion": string
 *     }
 *   },
 *   "timestamp": Date
 * }
 */
router.get('/embeddings', getEmbeddingMetrics)

/**
 * GET /api/swipe-engine/metrics/ranking
 * Obtém estatísticas de ranking de clusters
 * 
 * Query Parameters:
 * - userId: string (opcional) - ID do usuário para análise específica
 * - limit: number (opcional, padrão: 10) - Limite de resultados
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "userRankings": {
 *       "totalClustersRanked": number,
 *       "averageScore": number,
 *       "scoreDistribution": {
 *         "0.0-0.2": number,
 *         "0.2-0.4": number,
 *         "0.4-0.6": number,
 *         "0.6-0.8": number,
 *         "0.8-1.0": number
 *       },
 *       "topClusters": Array,
 *       "confidenceStats": {
 *         "average": number,
 *         "min": number,
 *         "max": number
 *       }
 *     },
 *     "componentScores": {
 *       "affinity": { "average": number, "min": number, "max": number },
 *       "engagement": { "average": number, "min": number, "max": number },
 *       "novelty": { "average": number, "min": number, "max": number },
 *       "diversity": { "average": number, "min": number, "max": number },
 *       "temporal": { "average": number, "min": number, "max": number },
 *       "quality": { "average": number, "min": number, "max": number }
 *     }
 *   },
 *   "userId": string,
 *   "timestamp": Date
 * }
 */
router.get('/ranking', getClusterRankingMetrics)

/**
 * GET /api/swipe-engine/metrics/interactions/:userId
 * Obtém estatísticas de interações do usuário
 * 
 * Path Parameters:
 * - userId: string - ID do usuário
 * 
 * Query Parameters:
 * - days: number (opcional, padrão: 30) - Período de análise em dias
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "userId": string,
 *     "period": string,
 *     "totalInteractions": number,
 *     "interactionsByType": {
 *       "partialView": number,
 *       "completeView": number,
 *       "like": number,
 *       "likeComment": number,
 *       "comment": number,
 *       "share": number,
 *       "save": number,
 *       "report": number
 *     },
 *     "engagementTrend": {
 *       "daily": Array,
 *       "weekly": Array,
 *       "monthly": Array
 *     },
 *     "topInterests": Array,
 *     "interactionQuality": {
 *       "averageDuration": number,
 *       "completionRate": number,
 *       "retentionRate": number
 *     }
 *   },
 *   "timestamp": Date
 * }
 */
router.get('/interactions/:userId', getUserInteractionMetrics)

/**
 * GET /api/swipe-engine/metrics/performance
 * Obtém estatísticas de performance do sistema
 * 
 * Query Parameters:
 * - period: string (opcional, padrão: '24h') - Período de análise ('1h', '24h', '7d', '30d')
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "period": string,
 *     "responseTimes": {
 *       "average": number,
 *       "p50": number,
 *       "p95": number,
 *       "p99": number
 *     },
 *     "throughput": {
 *       "requestsPerSecond": number,
 *       "requestsPerMinute": number,
 *       "requestsPerHour": number
 *     },
 *     "errors": {
 *       "total": number,
 *       "rate": number,
 *       "byType": {
 *         "timeout": number,
 *         "validation": number,
 *         "internal": number,
 *         "external": number
 *       }
 *     },
 *     "resources": {
 *       "cpuUsage": number,
 *       "memoryUsage": number,
 *       "diskUsage": number,
 *       "networkIO": number
 *     },
 *     "cache": {
 *       "hitRate": number,
 *       "missRate": number,
 *       "size": number,
 *       "evictions": number
 *     }
 *   },
 *   "timestamp": Date
 * }
 */
router.get('/performance', getPerformanceMetrics)

/**
 * GET /api/swipe-engine/metrics/quality
 * Obtém estatísticas de qualidade das recomendações
 * 
 * Query Parameters:
 * - userId: string (opcional) - ID do usuário para análise específica
 * - days: number (opcional, padrão: 7) - Período de análise em dias
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "userId": string,
 *     "period": string,
 *     "engagement": {
 *       "clickThroughRate": number,
 *       "averageTimeSpent": number,
 *       "completionRate": number,
 *       "bounceRate": number
 *     },
 *     "diversity": {
 *       "topicDiversity": number,
 *       "creatorDiversity": number,
 *       "formatDiversity": number,
 *       "overallDiversity": number
 *     },
 *     "novelty": {
 *       "newContentRate": number,
 *       "newTopicRate": number,
 *       "explorationScore": number
 *     },
 *     "relevance": {
 *       "averageScore": number,
 *       "precision": number,
 *       "recall": number,
 *       "f1Score": number
 *     },
 *     "userSatisfaction": {
 *       "explicitFeedback": {
 *         "positive": number,
 *         "negative": number,
 *         "neutral": number
 *       },
 *       "implicitFeedback": {
 *         "likes": number,
 *         "shares": number,
 *         "saves": number,
 *         "skips": number
 *       }
 *     }
 *   },
 *   "timestamp": Date
 * }
 */
router.get('/quality', getRecommendationQualityMetrics)

/**
 * GET /api/swipe-engine/metrics/trends
 * Obtém estatísticas de tendências temporais
 * 
 * Query Parameters:
 * - days: number (opcional, padrão: 30) - Período de análise em dias
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "period": string,
 *     "hourlyActivity": {
 *       "peakHours": Array<number>,
 *       "lowActivityHours": Array<number>,
 *       "averageActivityByHour": Array<{hour: number, activity: number}>
 *     },
 *     "dailyActivity": {
 *       "weekdayActivity": number,
 *       "weekendActivity": number,
 *       "averageActivityByDay": Array<{day: number, activity: number}>
 *     },
 *     "contentTrends": {
 *       "popularTopics": Array,
 *       "trendingCreators": Array,
 *       "viralContent": Array
 *     },
 *     "userBehavior": {
 *       "sessionDuration": number,
 *       "sessionsPerDay": number,
 *       "retentionRate": number
 *     }
 *   },
 *   "timestamp": Date
 * }
 */
router.get('/trends', getTemporalTrends)

/**
 * GET /api/swipe-engine/metrics/report
 * Obtém relatório completo de métricas
 * 
 * Query Parameters:
 * - userId: string (opcional) - ID do usuário para análise específica
 * - period: string (opcional, padrão: '7d') - Período de análise ('1h', '24h', '7d', '30d')
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "userId": string,
 *     "period": string,
 *     "generatedAt": Date,
 *     "summary": {
 *       "totalRecommendations": number,
 *       "averageEngagement": number,
 *       "systemHealth": string,
 *       "keyInsights": Array
 *     },
 *     "metrics": {
 *       "system": Object,
 *       "clusters": Object,
 *       "embeddings": Object,
 *       "ranking": Object,
 *       "interactions": Object,
 *       "performance": Object,
 *       "quality": Object,
 *       "trends": Object
 *     },
 *     "recommendations": {
 *       "systemOptimization": Array,
 *       "userExperience": Array,
 *       "contentStrategy": Array
 *     }
 *   },
 *   "timestamp": Date
 * }
 */
router.get('/report', getComprehensiveReport)