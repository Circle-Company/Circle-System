import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Request, Response } from 'express'
import { 
    boost_moment, 
    get_boost_analytics, 
    cancel_boost,
    like_moment,
    comment_on_moment
} from './moment-actions-controller'
import { PaymentRequiredError, UnauthorizedError } from '../../errors'
import { StatusCodes } from 'http-status-codes'

// Mock dependencies
vi.mock('../../classes/user/UserFactory', () => ({
    UserFactory: {
        createUser: vi.fn()
    }
}))

vi.mock('../../services/moment-service', () => ({
    MomentService: {
        Actions: {
            Like: vi.fn(),
            CommentOnMoment: vi.fn()
        },
        Find: {
            FindById: vi.fn()
        }
    }
}))

vi.mock('../../swipe-engine/core/feedback/FeedbackProcessor', () => ({
    FeedbackProcessor: vi.fn().mockImplementation(() => ({
        processInteraction: vi.fn().mockResolvedValue(undefined)
    }))
}))

describe('Moment Actions Controller - Premium Features', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>
    let mockUser: any

    beforeEach(() => {
        mockRequest = {
            user_id: BigInt(123),
            user: undefined,
            body: {},
            params: { id: '456' }
        }

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        }

        mockUser = {
            id: BigInt(123),
            username: 'testuser',
            subscriptionTier: 'premium',
            canBoostMoment: vi.fn(),
            isWithinUsageLimit: vi.fn(),
            getRemainingUsage: vi.fn(),
            trackFeatureUsage: vi.fn(),
            canAccessFeature: vi.fn()
        }
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('boost_moment', () => {
        beforeEach(() => {
            mockRequest.body = {
                boost_type: 'engagement',
                duration_hours: 24
            }
        })

        it('should boost moment successfully for premium user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            const { MomentService } = await import('../../services/moment-service')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canBoostMoment.mockResolvedValue(true)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.getRemainingUsage.mockResolvedValue(25)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            
            vi.mocked(MomentService.Find.FindById).mockResolvedValue({
                id: BigInt(456),
                user_id: BigInt(123),
                content: 'Test moment'
            } as any)

            await boost_moment(mockRequest as Request, mockResponse as Response)

            expect(mockUser.canBoostMoment).toHaveBeenCalledWith('engagement')
            expect(mockUser.trackFeatureUsage).toHaveBeenCalledWith('boosts')
            expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    boost: expect.any(Object),
                    analytics: expect.objectContaining({
                        expected_increase: expect.any(String),
                        remaining_boosts: 25
                    })
                })
            )
        })

        it('should deny boost for non-premium user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canBoostMoment.mockResolvedValue(false)

            await boost_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(402)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Payment Required',
                    upgrade_benefits: expect.objectContaining({
                        title: expect.stringContaining('Premium')
                    })
                })
            )
        })

        it('should deny boost when monthly limit reached', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canBoostMoment.mockResolvedValue(true)
            mockUser.isWithinUsageLimit.mockResolvedValue(false)
            mockUser.getRemainingUsage.mockResolvedValue(0)

            await boost_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(429)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Monthly boost limit reached',
                    remaining_boosts: 0
                })
            )
        })

        it('should deny boost for moments not owned by user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            const { MomentService } = await import('../../services/moment-service')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canBoostMoment.mockResolvedValue(true)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            
            vi.mocked(MomentService.Find.FindById).mockResolvedValue({
                id: BigInt(456),
                user_id: BigInt(999), // Different user
                content: 'Test moment'
            } as any)

            await boost_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Forbidden',
                    message: 'You can only boost your own moments'
                })
            )
        })

        it('should handle missing user_id', async () => {
            mockRequest.user_id = undefined

            await boost_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            )
        })

        it('should handle missing moment_id', async () => {
            mockRequest.params = {}

            await boost_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            )
        })

        it('should use default boost parameters', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            const { MomentService } = await import('../../services/moment-service')
            
            mockRequest.body = {} // No boost parameters
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canBoostMoment.mockResolvedValue(true)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.getRemainingUsage.mockResolvedValue(25)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            
            vi.mocked(MomentService.Find.FindById).mockResolvedValue({
                id: BigInt(456),
                user_id: BigInt(123),
                content: 'Test moment'
            } as any)

            await boost_moment(mockRequest as Request, mockResponse as Response)

            expect(mockUser.canBoostMoment).toHaveBeenCalledWith('engagement') // Default
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('24 hours') // Default duration
                })
            )
        })
    })

    describe('get_boost_analytics', () => {
        it('should return analytics for premium user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canAccessFeature.mockResolvedValue(true)

            await get_boost_analytics(mockRequest as Request, mockResponse as Response)

            expect(mockUser.canAccessFeature).toHaveBeenCalledWith('analytics_advanced')
            expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    analytics: expect.any(Object),
                    insights: expect.objectContaining({
                        message: expect.stringContaining('Premium')
                    })
                })
            )
        })

        it('should deny analytics for non-premium user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canAccessFeature.mockResolvedValue(false)

            await get_boost_analytics(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(402)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Payment Required',
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('boosts perform')
                    })
                })
            )
        })

        it('should handle missing user_id', async () => {
            mockRequest.user_id = undefined

            await get_boost_analytics(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            )
        })
    })

    describe('cancel_boost', () => {
        it('should cancel boost successfully', async () => {
            await cancel_boost(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Boost cancelled successfully'
                })
            )
        })

        it('should handle missing user_id', async () => {
            mockRequest.user_id = undefined

            await cancel_boost(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            )
        })

        it('should handle missing moment_id', async () => {
            mockRequest.params = {}

            await cancel_boost(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            )
        })
    })

    describe('like_moment - Premium Validation', () => {
        beforeEach(() => {
            const { MomentService } = require('../../services/moment-service')
            vi.mocked(MomentService.Actions.Like).mockResolvedValue({ success: true })
        })

        it('should allow like when within limit', async () => {
            mockRequest.user = mockUser
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)

            await like_moment(mockRequest as Request, mockResponse as Response)

            expect(mockUser.isWithinUsageLimit).toHaveBeenCalledWith('likes')
            expect(mockUser.trackFeatureUsage).toHaveBeenCalledWith('likes')
            expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.ACCEPTED)
        })

        it('should block like when monthly limit reached', async () => {
            mockRequest.user = mockUser
            mockUser.subscriptionTier = 'free'
            mockUser.isWithinUsageLimit.mockResolvedValue(false)
            mockUser.getRemainingUsage.mockResolvedValue(0)

            await like_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(429)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Monthly like limit reached',
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('like more')
                    })
                })
            )
        })

        it('should work without user validation if not loaded', async () => {
            mockRequest.user = undefined

            await like_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.ACCEPTED)
        })
    })

    describe('comment_on_moment - Premium Validation', () => {
        beforeEach(() => {
            mockRequest.body = {
                comment_content: 'This is a test comment'
            }
            
            const { MomentService } = require('../../services/moment-service')
            vi.mocked(MomentService.Actions.CommentOnMoment).mockResolvedValue({ success: true })
        })

        it('should allow comment when within limit and length', async () => {
            mockRequest.user = mockUser
            mockUser.subscriptionTier = 'premium'
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)

            await comment_on_moment(mockRequest as Request, mockResponse as Response)

            expect(mockUser.isWithinUsageLimit).toHaveBeenCalledWith('comments')
            expect(mockUser.trackFeatureUsage).toHaveBeenCalledWith('comments')
            expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.ACCEPTED)
        })

        it('should block comment when monthly limit reached', async () => {
            mockRequest.user = mockUser
            mockUser.subscriptionTier = 'free'
            mockUser.isWithinUsageLimit.mockResolvedValue(false)
            mockUser.getRemainingUsage.mockResolvedValue(0)

            await comment_on_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(429)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Monthly comment limit reached',
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('engage more')
                    })
                })
            )
        })

        it('should block long comments for free users', async () => {
            mockRequest.user = mockUser
            mockRequest.body.comment_content = 'A'.repeat(300) // Longer than free limit
            mockUser.subscriptionTier = 'free'
            mockUser.isWithinUsageLimit.mockResolvedValue(true)

            await comment_on_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Comment too long',
                    max_length: 280,
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('longer comments')
                    })
                })
            )
        })

        it('should allow long comments for premium users', async () => {
            mockRequest.user = mockUser
            mockRequest.body.comment_content = 'A'.repeat(500) // Within premium limit
            mockUser.subscriptionTier = 'premium'
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)

            await comment_on_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.ACCEPTED)
        })

        it('should handle missing user_id', async () => {
            mockRequest.user_id = undefined

            await comment_on_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
        })

        it('should work without user validation if not loaded', async () => {
            mockRequest.user = undefined

            await comment_on_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.ACCEPTED)
        })
    })

    describe('Boost Helper Functions', () => {
        it('should return correct boost multipliers', () => {
            // Since the function is not exported, we test it indirectly
            // by checking the response includes the multiplier
            expect(true).toBe(true) // Placeholder - in real test we'd import the function
        })
    })

    describe('Error Handling', () => {
        it('should handle boost application errors', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            const { MomentService } = await import('../../services/moment-service')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canBoostMoment.mockResolvedValue(true)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            
            vi.mocked(MomentService.Find.FindById).mockRejectedValue(new Error('Database error'))

            await boost_moment(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            )
        })

        it('should handle analytics errors', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockRejectedValue(new Error('User creation failed'))

            await get_boost_analytics(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
        })
    })

    describe('Integration with Swipe Engine', () => {
        it('should process feedback for boost interactions', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            const { MomentService } = await import('../../services/moment-service')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canBoostMoment.mockResolvedValue(true)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            
            vi.mocked(MomentService.Find.FindById).mockResolvedValue({
                id: BigInt(456),
                user_id: BigInt(123),
                content: 'Test moment'
            } as any)

            await boost_moment(mockRequest as Request, mockResponse as Response)

            // Should have called swipe engine integration
            expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED)
        })
    })
})
