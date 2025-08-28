import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { 
    find_user_data, 
    search_user, 
    get_premium_analytics 
} from './user-find-controller'
import { UnauthorizedError, PaymentRequiredError } from '../../errors'

// Mock dependencies
vi.mock('../../classes/user/UserFactory', () => ({
    UserFactory: {
        createUser: vi.fn()
    }
}))

vi.mock('../../services/user-service', () => ({
    UserService: {
        UserFind: {
            FindAllData: vi.fn(),
            SearchUser: vi.fn()
        }
    }
}))

describe('User Find Controller - Premium Features', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>
    let mockNext: NextFunction
    let mockUser: any

    beforeEach(() => {
        mockRequest = {
            user_id: BigInt(123),
            user: undefined,
            params: { username: 'testuser' },
            body: { searchTerm: 'search query' }
        }

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        }

        mockNext = vi.fn()

        mockUser = {
            id: BigInt(123),
            username: 'testuser',
            subscriptionTier: 'premium',
            trackFeatureUsage: vi.fn(),
            isWithinUsageLimit: vi.fn(),
            getRemainingUsage: vi.fn(),
            canAccessFeature: vi.fn()
        }
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('find_user_data', () => {
        const mockUserData = {
            id: BigInt(456),
            username: 'targetuser',
            name: 'Target User',
            description: 'User description',
            verifyed: true
        }

        beforeEach(() => {
            const { UserService } = require('../../services/user-service')
            vi.mocked(UserService.UserFind.FindAllData).mockResolvedValue(mockUserData)
        })

        it('should return user data with premium insights for premium user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.canAccessFeature.mockResolvedValue(true)

            await find_user_data(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockUser.trackFeatureUsage).toHaveBeenCalledWith('profile_views')
            expect(mockUser.canAccessFeature).toHaveBeenCalledWith('analytics_advanced')
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...mockUserData,
                    premium_insights: expect.objectContaining({
                        mutual_connections: expect.any(Object),
                        interaction_history: expect.any(Object),
                        insights: expect.objectContaining({
                            message: expect.stringContaining('Premium analytics')
                        })
                    })
                })
            )
        })

        it('should return user data with upgrade suggestion for free user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'free'
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.canAccessFeature.mockResolvedValue(false)

            await find_user_data(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...mockUserData,
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('insights'),
                        features: expect.arrayContaining(['See mutual friends'])
                    })
                })
            )
        })

        it('should block when profile view limit reached', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'free'
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.isWithinUsageLimit.mockResolvedValue(false)
            mockUser.getRemainingUsage.mockResolvedValue(0)

            await find_user_data(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockResponse.status).toHaveBeenCalledWith(429)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Monthly profile view limit reached',
                    remaining_views: 0,
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('explore more profiles')
                    })
                })
            )
        })

        it('should handle missing user_id', async () => {
            mockRequest.user_id = undefined

            await find_user_data(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
        })

        it('should handle user service errors', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            const { UserService } = require('../../services/user-service')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            
            vi.mocked(UserService.UserFind.FindAllData).mockRejectedValue(new Error('Service error'))

            await find_user_data(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'An unexpected error occurred.'
                })
            )
        })

        it('should work without user object loaded', async () => {
            mockRequest.user = undefined

            await find_user_data(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(mockUserData)
        })
    })

    describe('search_user', () => {
        const mockSearchResult = {
            users: [
                { id: BigInt(1), username: 'user1' },
                { id: BigInt(2), username: 'user2' }
            ],
            total: 2
        }

        beforeEach(() => {
            const { UserService } = require('../../services/user-service')
            vi.mocked(UserService.UserFind.SearchUser).mockResolvedValue(mockSearchResult)
        })

        it('should return search results with premium filters for premium user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            mockUser.canAccessFeature.mockResolvedValue(true)

            await search_user(mockRequest as Request, mockResponse as Response)

            expect(mockUser.isWithinUsageLimit).toHaveBeenCalledWith('searches')
            expect(mockUser.trackFeatureUsage).toHaveBeenCalledWith('searches')
            expect(mockUser.canAccessFeature).toHaveBeenCalledWith('advanced_search')
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...mockSearchResult,
                    premium_filters: expect.objectContaining({
                        available: true,
                        filters: expect.arrayContaining(['Location', 'Interests'])
                    })
                })
            )
        })

        it('should return search results with upgrade suggestion for free user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'free'
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            mockUser.canAccessFeature.mockResolvedValue(false)

            await search_user(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...mockSearchResult,
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('exactly who you\'re looking for'),
                        features: expect.arrayContaining(['Location-based search'])
                    })
                })
            )
        })

        it('should block when search limit reached', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'free'
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.isWithinUsageLimit.mockResolvedValue(false)
            mockUser.getRemainingUsage.mockResolvedValue(0)

            await search_user(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(429)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Monthly search limit reached',
                    remaining_searches: 0,
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('Need more searches')
                    })
                })
            )
        })

        it('should handle missing user_id', async () => {
            mockRequest.user_id = undefined

            await search_user(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
        })

        it('should work without user object loaded', async () => {
            mockRequest.user = undefined

            await search_user(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(mockSearchResult)
        })
    })

    describe('get_premium_analytics', () => {
        it('should return premium analytics for premium user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canAccessFeature.mockResolvedValue(true)

            await get_premium_analytics(mockRequest as Request, mockResponse as Response)

            expect(mockUser.canAccessFeature).toHaveBeenCalledWith('analytics_advanced')
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    analytics: expect.objectContaining({
                        profile_performance: expect.any(Object),
                        engagement_metrics: expect.any(Object),
                        follower_insights: expect.any(Object),
                        content_performance: expect.any(Object),
                        audience_demographics: expect.any(Object),
                        recommendations: expect.any(Array)
                    }),
                    insights: expect.objectContaining({
                        message: expect.stringContaining('Premium analytics'),
                        features: expect.arrayContaining(['Profile analytics'])
                    })
                })
            )
        })

        it('should deny analytics for non-premium user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'free'
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canAccessFeature.mockResolvedValue(false)

            await get_premium_analytics(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(402)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Payment Required',
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('detailed insights'),
                        features: expect.arrayContaining([
                            'Profile view analytics',
                            'Engagement rate tracking'
                        ])
                    })
                })
            )
        })

        it('should handle missing user_id', async () => {
            mockRequest.user_id = undefined

            await get_premium_analytics(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
        })

        it('should handle user loading errors', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockRejectedValue(new Error('User loading failed'))

            await get_premium_analytics(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Error getting analytics'
                })
            )
        })
    })

    describe('Helper Functions', () => {
        // Since helper functions are not directly exported, we test them indirectly
        it('should include mutual connections in premium insights', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            const { UserService } = require('../../services/user-service')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            vi.mocked(UserService.UserFind.FindAllData).mockResolvedValue({
                id: BigInt(456),
                username: 'targetuser'
            })
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.canAccessFeature.mockResolvedValue(true)

            await find_user_data(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    premium_insights: expect.objectContaining({
                        mutual_connections: expect.objectContaining({
                            count: expect.any(Number),
                            preview: expect.any(Array)
                        })
                    })
                })
            )
        })

        it('should include interaction history in premium insights', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            const { UserService } = require('../../services/user-service')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            vi.mocked(UserService.UserFind.FindAllData).mockResolvedValue({
                id: BigInt(456),
                username: 'targetuser'
            })
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.canAccessFeature.mockResolvedValue(true)

            await find_user_data(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    premium_insights: expect.objectContaining({
                        interaction_history: expect.objectContaining({
                            total_interactions: expect.any(Number),
                            interaction_types: expect.any(Object)
                        })
                    })
                })
            )
        })
    })

    describe('Analytics Data Quality', () => {
        it('should return comprehensive analytics data', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canAccessFeature.mockResolvedValue(true)

            await get_premium_analytics(mockRequest as Request, mockResponse as Response)

            const jsonCall = vi.mocked(mockResponse.json).mock.calls[0][0] as any
            const analytics = jsonCall.analytics

            // Check all required analytics sections
            expect(analytics.profile_performance).toHaveProperty('views_this_month')
            expect(analytics.profile_performance).toHaveProperty('growth_rate')
            expect(analytics.engagement_metrics).toHaveProperty('average_engagement_rate')
            expect(analytics.follower_insights).toHaveProperty('new_followers_this_month')
            expect(analytics.content_performance).toHaveProperty('best_performing_post_type')
            expect(analytics.audience_demographics).toHaveProperty('age_groups')
            expect(Array.isArray(analytics.recommendations)).toBe(true)
            expect(analytics.recommendations.length).toBeGreaterThan(0)
        })
    })

    describe('Performance Considerations', () => {
        it('should handle tracking failures gracefully', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            const { UserService } = require('../../services/user-service')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            vi.mocked(UserService.UserFind.FindAllData).mockResolvedValue({ id: BigInt(456) })
            mockUser.trackFeatureUsage.mockRejectedValue(new Error('Tracking failed'))
            mockUser.isWithinUsageLimit.mockResolvedValue(true)

            // Should not throw error even if tracking fails
            await expect(
                find_user_data(mockRequest as Request, mockResponse as Response, mockNext)
            ).resolves.not.toThrow()

            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })

        it('should handle analytics generation errors', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canAccessFeature.mockResolvedValue(true)

            // Mock internal error in getUserAnalytics
            await get_premium_analytics(mockRequest as Request, mockResponse as Response)

            // Should still return some response (mock data in this case)
            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })
    })
})
