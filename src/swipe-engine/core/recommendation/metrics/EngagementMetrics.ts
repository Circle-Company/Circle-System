/**
 * EngagementMetrics
 * 
 * Module responsible for calculating engagement metrics for clusters.
 * Evaluates the level of user interaction with cluster content.
 */

import { ClusterInfo, InteractionType, UserInteraction } from "../../types"

import { getLogger } from "../../utils/logger"

const logger = getLogger("EngagementMetrics")

export interface EngagementFactors {
    /**
     * Recency configurations for different interaction types
     */
    recency: {
        halfLifeHours: {
            partialView: number
            completeView: number
            like: number
            likeComment: number
            comment: number
            share: number
        }
    }
    
    /**
     * Weights for different interaction types
     */
    interactionWeights: {
        partialView: number
        completeView: number
        like: number
        likeComment: number
        comment: number
        share: number
    }
    
    /**
     * Default weights for unconfigured interaction types
     */
    defaultInteractionWeights?: {
        partialView: number
        completeView: number
        like: number
        likeComment: number
        comment: number
        share: number
        report: number
        showLessOften: number
        click: number
        default: number
    }
    
    /**
     * Temporal decay factor for engagement
     */
    timeDecayFactor: number
    
    /**
     * Maximum number of interactions to consider per user
     */
    maxInteractionsPerUser?: number
    
    /**
     * Factor to normalize engagement scores
     */
    normalizationFactor?: number
}

/**
 * Calculates an engagement score for a cluster based on user interactions
 * 
 * @param cluster Cluster information
 * @param userInteractions User interactions with content
 * @param factors Configuration factors for calculation
 * @returns Engagement score (0-1)
 */
export function calculateEngagementScore(
    cluster: ClusterInfo,
    userInteractions: UserInteraction[],
    factors: EngagementFactors
): number {
    try {
        if (!userInteractions.length || !cluster.memberIds || !cluster.memberIds.length) {
            return 0.5 // Neutral score when insufficient data
        }
        
        // Extract content IDs from cluster
        const clusterContentIds = new Set(cluster.memberIds.map(id => id.toString()))
        
        // Filter relevant interactions for this cluster
        const relevantInteractions = userInteractions.filter(interaction => 
            clusterContentIds.has(interaction.entityId.toString())
        )
        
        if (relevantInteractions.length === 0) {
            return 0.4 // Slightly below neutral score when no specific interactions
        }
        
        // Calculate score based on interactions, applying temporal decay
        let totalScore = 0
        const now = new Date()
        
        // Limit number of interactions to avoid bias
        const limitedInteractions = relevantInteractions
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, factors.maxInteractionsPerUser || relevantInteractions.length)
        
        for (const interaction of limitedInteractions) {
            // 1. Get base weight for interaction type
            const interactionType = interaction.type
            const baseWeight = getInteractionWeight(interactionType, factors.interactionWeights, factors.defaultInteractionWeights)
            
            // 2. Apply temporal decay
            const ageHours = (now.getTime() - interaction.timestamp.getTime()) / (1000 * 60 * 60)
            const decayFactor = calculateTemporalDecay(ageHours, interactionType, factors.recency.halfLifeHours)
            
            // 3. Calculate score for this interaction
            const interactionScore = baseWeight * decayFactor
            
            // 4. Add to total score
            totalScore += interactionScore
        }
        
        // Normalize score
        const normalizedScore = 1 - Math.exp(-totalScore * (factors.normalizationFactor || 1))
        
        // Ensure score is in range [0, 1]
        return Math.max(0, Math.min(1, normalizedScore))
    } catch (error) {
        logger.error(`Error calculating engagement score: ${error}`)
        return 0.5 // Neutral value in case of error
    }
}

/**
 * Calculates temporal decay factor for an interaction
 */
function calculateTemporalDecay(
    ageHours: number,
    interactionType: string,
    halfLifeHours: { [key: string]: number }
): number {
    // Get appropriate half-life for interaction type
    const halfLife = halfLifeHours[interactionType] || halfLifeHours.completeView
    
    // Apply exponential decay function
    return Math.exp(-Math.log(2) * ageHours / halfLife)
}

/**
 * Gets base weight for an interaction type
 */
function getInteractionWeight(
    interactionType: string,
    weights: { [key: string]: number },
    defaultWeights?: { [key: string]: number }
): number {
    // Check if type exists in configuration
    if (interactionType in weights) {
        return weights[interactionType]
    }
    
    // Use default weights if available
    if (defaultWeights && interactionType in defaultWeights) {
        return defaultWeights[interactionType]
    }
    
    // Fallback to hardcoded defaults if no default weights provided
    const fallbackWeights = {
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
    
    return fallbackWeights[interactionType] || fallbackWeights.default
}

/**
 * Calculates detailed engagement metrics for a cluster
 */
export function calculateDetailedEngagementMetrics(
    cluster: ClusterInfo,
    allInteractions: UserInteraction[]
): {
    totalInteractions: number
    interactionsByType: { [key: string]: number }
    engagementRate: number
    retentionRate: number
    uniqueUsers: number
} {
    try {
        if (!cluster.memberIds || !cluster.memberIds.length) {
            return {
                totalInteractions: 0,
                interactionsByType: {},
                engagementRate: 0,
                retentionRate: 0,
                uniqueUsers: 0
            }
        }
        
        // Extract content IDs from cluster
        const clusterContentIds = new Set(cluster.memberIds.map(id => id.toString()))
        
        // Filter relevant interactions for this cluster
        const relevantInteractions = allInteractions.filter(interaction => 
            clusterContentIds.has(interaction.entityId.toString())
        )
        
        // Count interactions by type
        const interactionsByType: { [key: string]: number } = {}
        for (const interaction of relevantInteractions) {
            const type = interaction.type
            interactionsByType[type] = (interactionsByType[type] || 0) + 1
        }
        
        // Count unique users
        const uniqueUsers = new Set(relevantInteractions.map(i => i.userId.toString())).size
        
        // Calculate rates
        const totalInteractions = relevantInteractions.length
        const clusterSize = cluster.memberIds.length
        
        // Engagement rate (interactions per item)
        const engagementRate = clusterSize > 0 ? totalInteractions / clusterSize : 0
        
        // Retention rate (proportion of users who return to cluster)
        // Simplification: count users with more than one interaction
        const userInteractionCounts = new Map<string, number>()
        for (const interaction of relevantInteractions) {
            const userId = interaction.userId.toString()
            userInteractionCounts.set(userId, (userInteractionCounts.get(userId) || 0) + 1)
        }
        
        const returningUsers = Array.from(userInteractionCounts.values()).filter(count => count > 1).length
        const retentionRate = uniqueUsers > 0 ? returningUsers / uniqueUsers : 0
        
        return {
            totalInteractions,
            interactionsByType,
            engagementRate,
            retentionRate,
            uniqueUsers
        }
    } catch (error) {
        logger.error(`Error calculating detailed engagement metrics: ${error}`)
        return {
            totalInteractions: 0,
            interactionsByType: {},
            engagementRate: 0,
            retentionRate: 0,
            uniqueUsers: 0
        }
    }
}

/**
 * Determines view type based on duration and watch percentage
 * 
 * @param durationSeconds Duration of view in seconds
 * @param watchPercentage Percentage of content watched (0-1)
 * @returns View type ('partialView' or 'completeView')
 */
export function determineViewType(
    durationSeconds: number,
    watchPercentage: number
): 'partialView' | 'completeView' {
    // Criteria for complete view:
    // 1. Minimum duration of 30 seconds OR
    // 2. Watch percentage above 80%
    const isComplete = durationSeconds >= 30 || watchPercentage >= 0.8
    
    return isComplete ? 'completeView' : 'partialView'
}

/**
 * Processes a view interaction with additional metadata
 * 
 * @param interaction Base interaction
 * @param durationSeconds Duration of view in seconds
 * @param watchPercentage Percentage of content watched (0-1)
 * @returns Processed interaction with correct type
 */
export function processViewInteraction(
    interaction: UserInteraction,
    durationSeconds: number,
    watchPercentage: number
): UserInteraction {
    const viewType = determineViewType(durationSeconds, watchPercentage)
    
    return {
        ...interaction,
        type: viewType as InteractionType,
        metadata: {
            ...interaction.metadata,
            durationSeconds,
            watchPercentage,
            viewType
        }
    }
}

/**
 * Processes a comment like interaction
 * 
 * @param interaction Base interaction
 * @param commentId ID of comment that received the like
 * @returns Processed interaction as likeComment
 */
export function processCommentLikeInteraction(
    interaction: UserInteraction,
    commentId: string
): UserInteraction {
    return {
        ...interaction,
        type: 'likeComment' as InteractionType,
        metadata: {
            ...interaction.metadata,
            commentId,
            targetType: 'comment'
        }
    }
}

/**
 * Processes a save interaction
 * 
 * @param interaction Base interaction
 * @param saveReason Reason for saving (optional)
 * @returns Processed interaction as save
 */
export function processSaveInteraction(
    interaction: UserInteraction,
    saveReason?: string
): UserInteraction {
    return {
        ...interaction,
        type: 'save' as InteractionType,
        metadata: {
            ...interaction.metadata,
            saveReason,
            targetType: 'content'
        }
    }
} 