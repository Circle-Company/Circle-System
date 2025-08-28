import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FreeUser } from './freeUser'
import { UserData, SubscriptionTier } from '../../services/user-service/types'

describe('FreeUser', () => {
    let userData: UserData
    let freeUser: FreeUser

    beforeEach(() => {
        userData = {
            id: BigInt(123),
            username: 'freeuser',
            name: 'Free User',
            email: 'free@example.com',
            subscription_tier: 'free' as SubscriptionTier,
            verifyed: false,
            blocked: false,
            deleted: false,
            muted: false,
            access_level: 0,
            description: 'Free user description',
            send_notification_emails: true,
            created_at: new Date(),
            updated_at: new Date(),
            statistics: null,
            preferences: null
        }

        freeUser = new FreeUser(userData)
    })

    describe('Feature Access', () => {
        it('should allow access to basic features', async () => {
            const basicFeatures = [
                'basic_posting',
                'basic_search', 
                'basic_profile',
                'follow_users',
                'like_comments',
                'view_moments',
                'basic_notifications'
            ]

            for (const feature of basicFeatures) {
                const canAccess = await freeUser.canAccessFeature(feature)
                expect(canAccess).toBe(true)
            }
        })

        it('should deny access to premium features', async () => {
            const premiumFeatures = [
                'profile_highlight',
                'advanced_search',
                'moment_boost',
                'analytics_advanced',
                'priority_support',
                'higher_rate_limits',
                'extended_storage',
                'custom_themes',
                'badges_premium',
                'priority_notifications',
                'unlimited_memories',
                'video_hd_upload',
                'priority_feed_placement',
                'advanced_filters',
                'export_data',
                'ad_free_experience'
            ]

            for (const feature of premiumFeatures) {
                const canAccess = await freeUser.canAccessFeature(feature)
                expect(canAccess).toBe(false)
            }
        })
    })

    describe('Rate Limits', () => {
        it('should return restrictive rate limits for free users', () => {
            const endpoints = [
                'POST /api/moments',
                'POST /api/users/follow',
                'GET /api/search',
                'GET /api/users',
                'POST /api/moments/like',
                'POST /api/moments/comment'
            ]

            endpoints.forEach(endpoint => {
                const rateLimit = freeUser.getRateLimit(endpoint)
                expect(rateLimit).toHaveProperty('requests')
                expect(rateLimit).toHaveProperty('window')
                expect(rateLimit).toHaveProperty('burst')
                expect(rateLimit.requests).toBeGreaterThan(0)
                expect(rateLimit.requests).toBeLessThanOrEqual(30) // Free users have low limits
            })
        })

        it('should return zero rate limit for analytics endpoint', () => {
            const rateLimit = freeUser.getRateLimit('GET /api/analytics')
            expect(rateLimit.requests).toBe(0)
            expect(rateLimit.burst).toBe(0)
        })

        it('should return default rate limit for unknown endpoints', () => {
            const rateLimit = freeUser.getRateLimit('GET /api/unknown')
            expect(rateLimit.requests).toBe(100)
            expect(rateLimit.window).toBe('15m')
            expect(rateLimit.burst).toBe(20)
        })
    })

    describe('Storage Limits', () => {
        it('should return restrictive storage limits', () => {
            const storageLimit = freeUser.getStorageLimit()
            
            expect(storageLimit.totalMB).toBe(100)
            expect(storageLimit.videoDurationMax).toBe(300) // 5 minutes
            expect(storageLimit.imagesMax).toBe(50)
            expect(storageLimit.memoriesMax).toBe(5)
            expect(storageLimit.momentsPerDay).toBe(5)
            expect(storageLimit.videoResolution).toBe('SD')
            expect(storageLimit.imageQuality).toBe('medium')
        })
    })

    describe('Monthly Limits', () => {
        it('should return restrictive monthly limits', () => {
            const monthlyLimits = freeUser.getMonthlyLimits()
            
            expect(monthlyLimits.posts).toBe(150)
            expect(monthlyLimits.likes).toBe(600)
            expect(monthlyLimits.comments).toBe(300)
            expect(monthlyLimits.follows).toBe(60)
            expect(monthlyLimits.searches).toBe(300)
            expect(monthlyLimits.profile_views).toBe(100)
            expect(monthlyLimits.boosts).toBe(0) // No boosts for free
        })
    })

    describe('Boost Capabilities', () => {
        it('should not allow any type of boost', async () => {
            const boostTypes = ['engagement', 'temporal', 'visibility']
            
            for (const type of boostTypes) {
                const canBoost = await freeUser.canBoostMoment(type as any)
                expect(canBoost).toBe(false)
            }
        })
    })

    describe('Priority Level', () => {
        it('should return minimum priority level', () => {
            const priority = freeUser.getPriorityLevel()
            expect(priority).toBe(1)
        })
    })

    describe('Free User Specific Methods', () => {
        beforeEach(() => {
            // Mock feature usage service
            vi.doMock('../../classes/plans/FeatureUsageService', () => ({
                FeatureUsageService: {
                    getStats: vi.fn().mockResolvedValue({
                        current: 3,
                        limit: 5,
                        resetPeriod: 'daily',
                        lastUsedAt: new Date(),
                        resetDate: new Date(),
                        percentage: 60
                    })
                }
            }))
        })

        it('should check if can post today', async () => {
            const canPost = await freeUser.canPostToday()
            expect(typeof canPost).toBe('boolean')
        })

        it('should return posts remaining today', async () => {
            const remaining = await freeUser.getPostsRemainingToday()
            expect(typeof remaining).toBe('number')
            expect(remaining).toBeGreaterThanOrEqual(0)
        })

        it('should check media upload capability', async () => {
            // Test image upload within limits
            const canUploadSmallImage = await freeUser.canUploadMedia(2, 'image')
            expect(typeof canUploadSmallImage).toBe('boolean')

            // Test video upload within limits
            const canUploadVideo = await freeUser.canUploadMedia(5, 'video')
            expect(typeof canUploadVideo).toBe('boolean')

            // Test oversized upload
            const canUploadLarge = await freeUser.canUploadMedia(200, 'image')
            expect(canUploadLarge).toBe(false)
        })
    })

    describe('Upgrade Suggestions', () => {
        it('should return appropriate upgrade suggestion for moment boost', () => {
            const suggestion = freeUser.getUpgradeSuggestion('moment_boost')
            
            expect(suggestion).toHaveProperty('title')
            expect(suggestion).toHaveProperty('description')
            expect(suggestion).toHaveProperty('benefits')
            expect(suggestion).toHaveProperty('cta')
            expect(suggestion.title).toContain('momentos')
            expect(Array.isArray(suggestion.benefits)).toBe(true)
        })

        it('should return appropriate upgrade suggestion for advanced search', () => {
            const suggestion = freeUser.getUpgradeSuggestion('advanced_search')
            
            expect(suggestion.title).toContain('pessoas')
            expect(suggestion.description).toContain('Busca avançada')
            expect(suggestion.benefits).toContain('Filtros avançados')
        })

        it('should return appropriate upgrade suggestion for analytics', () => {
            const suggestion = freeUser.getUpgradeSuggestion('analytics_advanced')
            
            expect(suggestion.title).toContain('audiência')
            expect(suggestion.benefits).toContain('Quem visitou seu perfil')
        })

        it('should return appropriate upgrade suggestion for storage', () => {
            const suggestion = freeUser.getUpgradeSuggestion('extended_storage')
            
            expect(suggestion.title).toContain('espaço')
            expect(suggestion.benefits).toContain('10GB de espaço')
        })

        it('should return default suggestion for unknown feature', () => {
            const suggestion = freeUser.getUpgradeSuggestion('unknown_feature')
            
            expect(suggestion.title).toContain('Circle Premium')
            expect(suggestion.cta).toBe('Upgrade para Premium')
        })
    })

    describe('JSON Serialization', () => {
        it('should serialize free user data correctly', () => {
            const json = freeUser.toJSON() as any
            
            expect(json.user_type).toBe('free')
            expect(json).toHaveProperty('limits')
            expect(json.limits).toHaveProperty('storage')
            expect(json.limits).toHaveProperty('monthly')
            expect(json.limits).toHaveProperty('rate_limits')
            expect(json.upgrade_available).toBe(true)
        })

        it('should include correct storage limits in JSON', () => {
            const json = freeUser.toJSON() as any
            
            expect(json.limits.storage.totalMB).toBe(100)
            expect(json.limits.storage.videoResolution).toBe('SD')
            expect(json.limits.storage.imageQuality).toBe('medium')
        })

        it('should include correct monthly limits in JSON', () => {
            const json = freeUser.toJSON() as any
            
            expect(json.limits.monthly.posts).toBe(150)
            expect(json.limits.monthly.boosts).toBe(0)
        })

        it('should include rate limits in JSON', () => {
            const json = freeUser.toJSON() as any
            
            expect(json.limits.rate_limits).toHaveProperty('posts_per_hour')
            expect(json.limits.rate_limits).toHaveProperty('searches_per_hour')
            expect(json.limits.rate_limits.posts_per_hour).toBe(5)
            expect(json.limits.rate_limits.searches_per_hour).toBe(20)
        })
    })

    describe('Inheritance from BaseUser', () => {
        it('should inherit base user properties', () => {
            expect(freeUser.id).toBe(BigInt(123))
            expect(freeUser.username).toBe('freeuser')
            expect(freeUser.subscriptionTier).toBe('free')
            expect(freeUser.isActive).toBe(true)
        })

        it('should override abstract methods correctly', async () => {
            // Test that all abstract methods are implemented
            const canAccess = await freeUser.canAccessFeature('basic_posting')
            expect(typeof canAccess).toBe('boolean')

            const rateLimit = freeUser.getRateLimit('GET /api/test')
            expect(rateLimit).toHaveProperty('requests')

            const storageLimit = freeUser.getStorageLimit()
            expect(storageLimit).toHaveProperty('totalMB')

            const monthlyLimits = freeUser.getMonthlyLimits()
            expect(monthlyLimits).toHaveProperty('posts')

            const canBoost = await freeUser.canBoostMoment('engagement')
            expect(canBoost).toBe(false)

            const priority = freeUser.getPriorityLevel()
            expect(priority).toBe(1)
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty current storage usage', async () => {
            // Mock getCurrentStorageUsage to return 0
            const canUpload = await freeUser.canUploadMedia(50, 'image')
            expect(typeof canUpload).toBe('boolean')
        })

        it('should handle empty current image count', async () => {
            // Mock getCurrentImageCount to return 0
            const canUpload = await freeUser.canUploadMedia(1, 'image')
            expect(typeof canUpload).toBe('boolean')
        })

        it('should handle exact limit values', async () => {
            // Test at exact storage limit
            const canUploadExact = await freeUser.canUploadMedia(100, 'image')
            expect(typeof canUploadExact).toBe('boolean')
        })
    })
})
