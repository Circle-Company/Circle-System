import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PremiumUser } from './premiumUser'
import { UserData, UserSubscription, SubscriptionTier } from '../../services/user-service/types'

describe('PremiumUser', () => {
    let userData: UserData
    let subscriptionData: UserSubscription
    let premiumUser: PremiumUser

    beforeEach(() => {
        userData = {
            id: BigInt(456),
            username: 'premiumuser',
            name: 'Premium User',
            email: 'premium@example.com',
            subscription_tier: 'premium' as SubscriptionTier,
            verifyed: true,
            blocked: false,
            deleted: false,
            muted: false,
            access_level: 2,
            description: 'Premium user description',
            send_notification_emails: true,
            created_at: new Date(),
            updated_at: new Date(),
            statistics: null,
            preferences: null
        }

        subscriptionData = {
            id: BigInt(2),
            user_id: BigInt(456),
            purchase_token: 'premium_token',
            product_id: 'circle_premium_monthly',
            order_id: 'ORDER_456',
            status: 'active',
            purchased_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            starts_at: new Date(),
            acknowledgment_state: 'acknowledged',
            auto_renewing: true,
            price_amount_micros: 9990000,
            price_currency_code: 'BRL',
            country_code: 'BR',
            original_json: '{}',
            last_validated_at: new Date(),
            validation_attempts: 1,
            created_at: new Date(),
            updated_at: new Date()
        }

        premiumUser = new PremiumUser(userData, subscriptionData)
    })

    beforeEach(() => {
        // Garantir state limpo para cada teste
        premiumUser = new PremiumUser(userData, subscriptionData)
    })

    describe('Feature Access', () => {
        it('should allow access to all features when subscription is active', async () => {
            const allFeatures = [
                // Basic features
                'basic_posting', 'basic_search', 'basic_profile', 'follow_users', 
                'like_comments', 'view_moments', 'basic_notifications',
                
                // Premium features
                'profile_highlight', 'advanced_search', 'moment_boost',
                'analytics_advanced', 'priority_support', 'higher_rate_limits',
                'extended_storage', 'custom_themes', 'badges_premium',
                'priority_notifications', 'unlimited_memories', 'video_hd_upload',
                'priority_feed_placement', 'advanced_filters', 'export_data',
                'ad_free_experience'
            ]

            for (const feature of allFeatures) {
                const canAccess = await premiumUser.canAccessFeature(feature)
                expect(canAccess, `Feature ${feature} should be accessible to premium user`).toBe(true)
            }
        })

        it('should deny premium features when subscription is inactive', async () => {
            // Create user with inactive subscription
            const inactiveSubscription = { ...subscriptionData, status: 'canceled' as const }
            const inactiveUser = new PremiumUser(userData, inactiveSubscription)

            const premiumFeatures = ['moment_boost', 'analytics_advanced', 'profile_highlight']
            
            for (const feature of premiumFeatures) {
                const canAccess = await inactiveUser.canAccessFeature(feature)
                expect(canAccess).toBe(false)
            }
        })

        it('should allow basic features even when subscription is inactive', async () => {
            const inactiveSubscription = { ...subscriptionData, status: 'canceled' as const }
            const inactiveUser = new PremiumUser(userData, inactiveSubscription)

            const basicFeatures = ['basic_posting', 'basic_search', 'basic_profile']
            
            for (const feature of basicFeatures) {
                const canAccess = await inactiveUser.canAccessFeature(feature)
                expect(canAccess).toBe(true)
            }
        })
    })

    describe('Rate Limits', () => {
        it('should return generous rate limits for premium users', () => {
            const rateLimit = premiumUser.getRateLimit('POST /api/moments')
            expect(rateLimit.requests).toBe(100)
            expect(rateLimit.window).toBe('1h')
            expect(rateLimit.burst).toBe(20)
        })

        it('should return high search limits', () => {
            const rateLimit = premiumUser.getRateLimit('GET /api/search')
            expect(rateLimit.requests).toBe(500)
            expect(rateLimit.window).toBe('1h')
            expect(rateLimit.burst).toBe(100)
        })

        it('should allow boost endpoints', () => {
            const rateLimit = premiumUser.getRateLimit('POST /api/moments/:id/boost')
            expect(rateLimit.requests).toBe(50)
            expect(rateLimit.window).toBe('1h')
            expect(rateLimit.burst).toBe(10)
        })

        it('should allow analytics access', () => {
            const rateLimit = premiumUser.getRateLimit('GET /api/analytics')
            expect(rateLimit.requests).toBe(200)
            expect(rateLimit.window).toBe('1h')
            expect(rateLimit.burst).toBe(40)
        })

        it('should allow data export', () => {
            const rateLimit = premiumUser.getRateLimit('GET /api/export')
            expect(rateLimit.requests).toBe(10)
            expect(rateLimit.window).toBe('24h')
            expect(rateLimit.burst).toBe(2)
        })

        it('should return default high limits for unknown endpoints', () => {
            const rateLimit = premiumUser.getRateLimit('GET /api/unknown')
            expect(rateLimit.requests).toBe(1000)
            expect(rateLimit.window).toBe('15m')
            expect(rateLimit.burst).toBe(200)
        })
    })

    describe('Storage Limits', () => {
        it('should return generous storage limits', () => {
            const storageLimit = premiumUser.getStorageLimit()
            
            expect(storageLimit.totalMB).toBe(10000) // 10GB
            expect(storageLimit.videoDurationMax).toBe(3600) // 1 hour
            expect(storageLimit.imagesMax).toBe(2000)
            expect(storageLimit.memoriesMax).toBe(-1) // Unlimited
            expect(storageLimit.momentsPerDay).toBe(100)
            expect(storageLimit.videoResolution).toBe('HD')
            expect(storageLimit.imageQuality).toBe('high')
        })
    })

    describe('Monthly Limits', () => {
        it('should return generous monthly limits', () => {
            const monthlyLimits = premiumUser.getMonthlyLimits()
            
            expect(monthlyLimits.posts).toBe(3000)
            expect(monthlyLimits.likes).toBe(12000)
            expect(monthlyLimits.comments).toBe(3000)
            expect(monthlyLimits.follows).toBe(600)
            expect(monthlyLimits.searches).toBe(15000)
            expect(monthlyLimits.profile_views).toBe(6000)
            expect(monthlyLimits.boosts).toBe(30)
        })
    })

    describe('Boost Capabilities', () => {
        it('should allow all boost types when active', async () => {
            const boostTypes = ['engagement', 'temporal', 'visibility']
            
            for (const type of boostTypes) {
                const canBoost = await premiumUser.canBoostMoment(type as any)
                expect(canBoost).toBe(true)
            }
        })

        it('should not allow boost when subscription is inactive', async () => {
            const inactiveSubscription = { ...subscriptionData, status: 'canceled' as const }
            const inactiveUser = new PremiumUser(userData, inactiveSubscription)

            const canBoost = await inactiveUser.canBoostMoment('engagement')
            expect(canBoost).toBe(false)
        })
    })

    describe('Priority Level', () => {
        it('should return maximum priority level', () => {
            const priority = premiumUser.getPriorityLevel()
            expect(priority).toBe(5)
        })
    })

    describe('Premium Specific Methods', () => {
        beforeEach(() => {
            // Mock feature usage service
            vi.doMock('../../classes/plans/FeatureUsageService', () => ({
                FeatureUsageService: {
                    getStats: vi.fn().mockResolvedValue({
                        current: 15,
                        limit: 30,
                        resetPeriod: 'monthly',
                        lastUsedAt: new Date(),
                        resetDate: new Date(),
                        percentage: 50
                    })
                }
            }))
        })

        it('should return boosts remaining', async () => {
            const remaining = await premiumUser.getBoostsRemaining()
            expect(typeof remaining).toBe('number')
            expect(remaining).toBeGreaterThanOrEqual(0)
        })

        it('should handle zero limit gracefully', async () => {
            // Mock with undefined boosts limit
            const limitWithUndefined = { ...premiumUser.getMonthlyLimits(), boosts: undefined }
            vi.spyOn(premiumUser, 'getMonthlyLimits').mockReturnValue(limitWithUndefined as any)

            const remaining = await premiumUser.getBoostsRemaining()
            expect(remaining).toBe(0)
        })

        it('should check if can use advanced analytics', async () => {
            const canUse = await premiumUser.canUseAdvancedAnalytics()
            expect(canUse).toBe(true)
        })

        it('should return available boost types', () => {
            const boostTypes = premiumUser.getAvailableBoostTypes()
            
            expect(Array.isArray(boostTypes)).toBe(true)
            expect(boostTypes).toHaveLength(3)
            
            const types = boostTypes.map(b => b.type)
            expect(types).toContain('engagement')
            expect(types).toContain('temporal')
            expect(types).toContain('visibility')

            // Check structure of boost type objects
            boostTypes.forEach(boost => {
                expect(boost).toHaveProperty('type')
                expect(boost).toHaveProperty('name')
                expect(boost).toHaveProperty('description')
                expect(boost).toHaveProperty('multiplier')
                expect(boost).toHaveProperty('icon')
            })
        })

        it('should check if can export data', async () => {
            const canExport = await premiumUser.canExportData()
            expect(canExport).toBe(true)
        })

        it('should return premium benefits', () => {
            const benefits = premiumUser.getPremiumBenefits()
            
            expect(Array.isArray(benefits)).toBe(true)
            expect(benefits.length).toBeGreaterThan(10)
            expect(benefits).toContain('🚀 30 boosts por mês')
            expect(benefits).toContain('📊 Analytics avançado')
            expect(benefits).toContain('💾 10GB de armazenamento')
        })
    })

    describe('Premium Analytics', () => {
        beforeEach(() => {
            vi.doMock('../../classes/plans/FeatureUsageService', () => ({
                FeatureUsageService: {
                    getStats: vi.fn().mockResolvedValue({
                        current: 10,
                        limit: 30,
                        resetPeriod: 'monthly',
                        lastUsedAt: new Date(),
                        resetDate: new Date(),
                        percentage: 33
                    })
                }
            }))
        })

        it('should return premium analytics when active', async () => {
            const analytics = await premiumUser.getPremiumAnalytics()
            
            expect(analytics).toHaveProperty('profile_views')
            expect(analytics).toHaveProperty('post_performance')
            expect(analytics).toHaveProperty('audience_insights')
            expect(analytics).toHaveProperty('boost_statistics')
        })

        it('should throw error when subscription is inactive', async () => {
            const inactiveSubscription = { ...subscriptionData, status: 'canceled' as const }
            const inactiveUser = new PremiumUser(userData, inactiveSubscription)

            await expect(inactiveUser.getPremiumAnalytics()).rejects.toThrow('Analytics avançado requer assinatura ativa')
        })
    })

    describe('JSON Serialization', () => {
        it('should serialize premium user data correctly', () => {
            const json = premiumUser.toJSON() as any
            
            expect(json.user_type).toBe('premium')
            expect(json).toHaveProperty('subscription')
            expect(json).toHaveProperty('limits')
            expect(json).toHaveProperty('premium_benefits')
            expect(json).toHaveProperty('available_boost_types')
        })

        it('should include subscription details in JSON', () => {
            const json = premiumUser.toJSON() as any
            
            expect(json.subscription.status).toBe('active')
            expect(json.subscription.auto_renewing).toBe(true)
            expect(json.subscription.product_id).toBe('circle_premium_monthly')
            expect(json.subscription).toHaveProperty('expires_at')
        })

        it('should include correct storage limits in JSON', () => {
            const json = premiumUser.toJSON() as any
            
            expect(json.limits.storage.totalMB).toBe(10000)
            expect(json.limits.storage.videoResolution).toBe('HD')
            expect(json.limits.storage.imageQuality).toBe('high')
        })

        it('should include correct monthly limits in JSON', () => {
            const json = premiumUser.toJSON() as any
            
            expect(json.limits.monthly.posts).toBe(3000)
            expect(json.limits.monthly.boosts).toBe(30)
        })

        it('should include rate limits in JSON', () => {
            const json = premiumUser.toJSON() as any
            
            expect(json.limits.rate_limits.posts_per_hour).toBe(100)
            expect(json.limits.rate_limits.searches_per_hour).toBe(500)
        })

        it('should include premium benefits and boost types', () => {
            const json = premiumUser.toJSON() as any
            
            expect(Array.isArray(json.premium_benefits)).toBe(true)
            expect(Array.isArray(json.available_boost_types)).toBe(true)
            expect(json.available_boost_types).toHaveLength(3)
        })
    })

    describe('Inheritance from BaseUser', () => {
        it('should inherit base user properties', () => {
            expect(premiumUser.id).toBe(BigInt(456))
            expect(premiumUser.username).toBe('premiumuser')
            expect(premiumUser.subscriptionTier).toBe('premium')
            expect(premiumUser.isActive).toBe(true)
        })

        it('should override abstract methods correctly', async () => {
            // Test that all abstract methods are implemented with premium logic
            const canAccess = await premiumUser.canAccessFeature('moment_boost')
            expect(canAccess).toBe(true)

            const rateLimit = premiumUser.getRateLimit('POST /api/moments')
            expect(rateLimit.requests).toBeGreaterThan(50) // Should be higher than free

            const storageLimit = premiumUser.getStorageLimit()
            expect(storageLimit.totalMB).toBeGreaterThan(1000) // Should be much higher than free

            const monthlyLimits = premiumUser.getMonthlyLimits()
            expect(monthlyLimits.posts).toBeGreaterThan(1000) // Should be higher than free

            const canBoost = await premiumUser.canBoostMoment('engagement')
            expect(canBoost).toBe(true)

            const priority = premiumUser.getPriorityLevel()
            expect(priority).toBe(5) // Maximum priority
        })
    })

    describe('Edge Cases', () => {
        it('should handle expired subscription correctly', async () => {
            const expiredSubscription = {
                ...subscriptionData,
                expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired yesterday
            }
            const expiredUser = new PremiumUser(userData, expiredSubscription)

            expect(expiredUser.isActive).toBe(false)
            
            const canBoost = await expiredUser.canBoostMoment('engagement')
            expect(canBoost).toBe(false)
        })

        it('should handle missing subscription data', () => {
            const userWithoutSub = new PremiumUser(userData, undefined)
            
            expect(userWithoutSub.isActive).toBe(false)
            expect(userWithoutSub.subscriptionExpiresAt).toBe(null)
        })

        it('should handle unknown boost types', async () => {
            const canBoost = await premiumUser.canBoostMoment('unknown_type' as any)
            expect(canBoost).toBe(false)
        })

        it('should handle future expiration dates', async () => {
            const futureSubscription = {
                ...subscriptionData,
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
            }
            const futureUser = new PremiumUser(userData, futureSubscription)

            expect(futureUser.isActive).toBe(true)
            
            const canBoost = await futureUser.canBoostMoment('engagement')
            expect(canBoost).toBe(true)
        })
    })

    describe('Private Methods', () => {
        it('should correctly identify basic features', () => {
            // Test private method through type assertion
            const isBasic1 = (premiumUser as any).isBasicFeature('basic_posting')
            const isBasic2 = (premiumUser as any).isBasicFeature('moment_boost')
            
            expect(isBasic1).toBe(true)
            expect(isBasic2).toBe(false)
        })
    })
})
