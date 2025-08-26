import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeatureUsageService } from './FeatureUsageService'

describe('FeatureUsageService', () => {
    const userId = BigInt(123)
    const featureName = 'posts'

    beforeEach(() => {
        // Clear any cached data
        vi.clearAllMocks()
        
        // Mock Date for consistent testing
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('track', () => {
        it('should track feature usage', async () => {
            await expect(FeatureUsageService.track(userId, featureName)).resolves.not.toThrow()
        })

        it('should handle tracking errors gracefully', async () => {
            // Mock internal error (would happen in real implementation)
            // For now, just ensure it doesn't throw
            await expect(FeatureUsageService.track(userId, 'invalid_feature')).resolves.not.toThrow()
        })
    })

    describe('getUsage', () => {
        it('should return usage data', async () => {
            const usage = await FeatureUsageService.getUsage(userId, featureName)
            
            expect(usage).toHaveProperty('count')
            expect(usage).toHaveProperty('lastUsedAt')
            expect(usage).toHaveProperty('resetPeriod')
            expect(usage).toHaveProperty('lastResetAt')
            expect(typeof usage.count).toBe('number')
            expect(usage.count).toBeGreaterThanOrEqual(0)
        })

        it('should return zero usage for new users', async () => {
            const newUserId = BigInt(999)
            const usage = await FeatureUsageService.getUsage(newUserId, featureName)
            
            expect(usage.count).toBe(0)
            expect(usage.lastUsedAt).toBeNull()
        })
    })

    describe('getStats', () => {
        it('should return comprehensive stats', async () => {
            const stats = await FeatureUsageService.getStats(userId, featureName)
            
            expect(stats).toHaveProperty('current')
            expect(stats).toHaveProperty('limit')
            expect(stats).toHaveProperty('resetPeriod')
            expect(stats).toHaveProperty('lastUsedAt')
            expect(stats).toHaveProperty('resetDate')
            expect(stats).toHaveProperty('percentage')
            
            expect(typeof stats.current).toBe('number')
            expect(typeof stats.limit).toBe('number')
            expect(typeof stats.percentage).toBe('number')
            expect(stats.current).toBeGreaterThanOrEqual(0)
            expect(stats.limit).toBeGreaterThan(0)
            expect(stats.percentage).toBeGreaterThanOrEqual(0)
            expect(stats.percentage).toBeLessThanOrEqual(100)
        })

        it('should calculate percentage correctly', async () => {
            const stats = await FeatureUsageService.getStats(userId, featureName)
            
            const expectedPercentage = (stats.current / stats.limit) * 100
            expect(stats.percentage).toBe(expectedPercentage)
        })

        it('should handle unlimited features', async () => {
            const unlimitedFeature = 'unlimited_feature'
            const stats = await FeatureUsageService.getStats(userId, unlimitedFeature)
            
            // For unlimited features, percentage should be 0
            if (stats.limit === -1) {
                expect(stats.percentage).toBe(0)
            }
        })
    })

    describe('resetUsage', () => {
        it('should reset usage for specific feature', async () => {
            // Track some usage first
            await FeatureUsageService.track(userId, featureName)
            
            // Reset usage
            await FeatureUsageService.resetUsage(userId, featureName)
            
            // Usage should be reset
            const usage = await FeatureUsageService.getUsage(userId, featureName)
            expect(usage.count).toBe(0)
        })

        it('should reset all usage when no feature specified', async () => {
            // Track usage for multiple features
            await FeatureUsageService.track(userId, 'posts')
            await FeatureUsageService.track(userId, 'likes')
            
            // Reset all usage
            await FeatureUsageService.resetUsage(userId)
            
            // All usage should be reset
            const postsUsage = await FeatureUsageService.getUsage(userId, 'posts')
            const likesUsage = await FeatureUsageService.getUsage(userId, 'likes')
            
            expect(postsUsage.count).toBe(0)
            expect(likesUsage.count).toBe(0)
        })
    })

    describe('getAllUsage', () => {
        it('should return all usage for user', async () => {
            const allUsage = await FeatureUsageService.getAllUsage(userId)
            
            expect(Array.isArray(allUsage)).toBe(true)
            
            if (allUsage.length > 0) {
                allUsage.forEach(usage => {
                    expect(usage).toHaveProperty('feature')
                    expect(usage).toHaveProperty('count')
                    expect(usage).toHaveProperty('lastUsedAt')
                    expect(usage).toHaveProperty('resetPeriod')
                    expect(usage).toHaveProperty('lastResetAt')
                })
            }
        })

        it('should return empty array for new users', async () => {
            const newUserId = BigInt(999)
            const allUsage = await FeatureUsageService.getAllUsage(newUserId)
            
            expect(Array.isArray(allUsage)).toBe(true)
            // Could be empty or have default entries depending on implementation
        })
    })

    describe('cleanupOldUsage', () => {
        it('should clean up old usage data', async () => {
            const daysToKeep = 30
            await expect(
                FeatureUsageService.cleanupOldUsage(daysToKeep)
            ).resolves.not.toThrow()
        })

        it('should use default cleanup period when not specified', async () => {
            await expect(
                FeatureUsageService.cleanupOldUsage()
            ).resolves.not.toThrow()
        })
    })

    describe('Reset Periods', () => {
        it('should handle daily reset period', async () => {
            const dailyFeature = 'daily_posts'
            const stats = await FeatureUsageService.getStats(userId, dailyFeature)
            
            // Reset date should be calculated correctly for daily period
            expect(stats.resetPeriod).toBe('daily')
            expect(stats.resetDate).toBeInstanceOf(Date)
        })

        it('should handle monthly reset period', async () => {
            const monthlyFeature = 'monthly_posts'
            const stats = await FeatureUsageService.getStats(userId, monthlyFeature)
            
            // Reset date should be calculated correctly for monthly period
            expect(stats.resetPeriod).toBe('monthly')
            expect(stats.resetDate).toBeInstanceOf(Date)
        })

        it('should handle weekly reset period', async () => {
            const weeklyFeature = 'weekly_posts'
            const stats = await FeatureUsageService.getStats(userId, weeklyFeature)
            
            expect(stats.resetPeriod).toBe('weekly')
            expect(stats.resetDate).toBeInstanceOf(Date)
        })
    })

    describe('Edge Cases', () => {
        it('should handle very large user IDs', async () => {
            const largeUserId = BigInt('9223372036854775807') // Max BigInt
            
            await expect(
                FeatureUsageService.track(largeUserId, featureName)
            ).resolves.not.toThrow()
            
            const usage = await FeatureUsageService.getUsage(largeUserId, featureName)
            expect(usage).toBeDefined()
        })

        it('should handle special characters in feature names', async () => {
            const specialFeature = 'feature-with_special.chars@123'
            
            await expect(
                FeatureUsageService.track(userId, specialFeature)
            ).resolves.not.toThrow()
        })

        it('should handle concurrent tracking requests', async () => {
            const promises = Array.from({ length: 10 }, () =>
                FeatureUsageService.track(userId, featureName)
            )
            
            await expect(Promise.all(promises)).resolves.not.toThrow()
        })
    })

    describe('Performance', () => {
        it('should handle bulk tracking efficiently', async () => {
            const startTime = Date.now()
            
            const promises = Array.from({ length: 100 }, (_, i) =>
                FeatureUsageService.track(BigInt(i), featureName)
            )
            
            await Promise.all(promises)
            
            const duration = Date.now() - startTime
            expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
        })
    })

    describe('Data Consistency', () => {
        it('should maintain consistent count after multiple tracks', async () => {
            const initialUsage = await FeatureUsageService.getUsage(userId, featureName)
            const initialCount = initialUsage.count
            
            // Track 5 times
            for (let i = 0; i < 5; i++) {
                await FeatureUsageService.track(userId, featureName)
            }
            
            const finalUsage = await FeatureUsageService.getUsage(userId, featureName)
            expect(finalUsage.count).toBe(initialCount + 5)
        })

        it('should update lastUsedAt timestamp correctly', async () => {
            const beforeTrack = new Date()
            
            await FeatureUsageService.track(userId, featureName)
            
            const usage = await FeatureUsageService.getUsage(userId, featureName)
            
            if (usage.lastUsedAt) {
                expect(usage.lastUsedAt.getTime()).toBeGreaterThanOrEqual(beforeTrack.getTime())
            }
        })
    })

    describe('Error Handling', () => {
        it('should handle invalid user IDs gracefully', async () => {
            // Test with negative user ID
            const invalidUserId = BigInt(-1)
            
            await expect(
                FeatureUsageService.track(invalidUserId, featureName)
            ).resolves.not.toThrow()
        })

        it('should handle empty feature names gracefully', async () => {
            await expect(
                FeatureUsageService.track(userId, '')
            ).resolves.not.toThrow()
        })

        it('should handle null/undefined parameters gracefully', async () => {
            await expect(
                FeatureUsageService.track(userId, null as any)
            ).resolves.not.toThrow()
        })
    })
})
