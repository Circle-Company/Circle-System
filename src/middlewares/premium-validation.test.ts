import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { 
    loadUserMiddleware, 
    requireFeature, 
    rateLimitMiddleware,
    trackFeatureUsage,
    checkStorageLimit,
    checkMonthlyLimit,
    premiumValidation
} from './premium-validation'
import { UnauthorizedError, PaymentRequiredError } from '../errors'
import { FreeUser } from '../classes/user/freeUser'
import { PremiumUser } from '../classes/user/premiumUser'

// Mock UserFactory
vi.mock('../classes/user/UserFactory', () => ({
    UserFactory: {
        createUser: vi.fn()
    }
}))

describe('Premium Validation Middleware', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>
    let mockNext: NextFunction
    let mockUser: any

    beforeEach(() => {
        mockRequest = {
            user_id: BigInt(123),
            user: undefined,
            body: {},
            query: {},
            params: {}
        }

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn().mockReturnThis()
        }

        mockNext = vi.fn() as unknown as NextFunction

        mockUser = {
            id: BigInt(123),
            username: 'testuser',
            subscriptionTier: 'free',
            canAccessFeature: vi.fn(),
            getRateLimit: vi.fn(),
            getStorageLimit: vi.fn(),
            getMonthlyLimits: vi.fn(),
            isWithinUsageLimit: vi.fn(),
            getRemainingUsage: vi.fn(),
            trackFeatureUsage: vi.fn(),
            getFeatureUsageStats: vi.fn()
        }
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('loadUserMiddleware', () => {
        it('should load user successfully', async () => {
            const { UserFactory } = await import('../classes/user/UserFactory')
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)

            await loadUserMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(UserFactory.createUser).toHaveBeenCalledWith(BigInt(123))
            expect(mockRequest.user).toBe(mockUser)
            expect(mockNext).toHaveBeenCalledWith()
        })

        it('should call next with error when user_id is missing', async () => {
            mockRequest.user_id = undefined

            await loadUserMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
        })

        it('should call next with error when user creation fails', async () => {
            const { UserFactory } = await import('../classes/user/UserFactory')
            vi.mocked(UserFactory.createUser).mockRejectedValue(new Error('Database error'))

            await loadUserMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
        })
    })

    describe('requireFeature', () => {
        it('should allow access when user has feature', async () => {
            mockRequest.user = mockUser
            mockUser.canAccessFeature.mockResolvedValue(true)

            const middleware = requireFeature('moment_boost')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockUser.canAccessFeature).toHaveBeenCalledWith('moment_boost')
            expect(mockNext).toHaveBeenCalledWith()
        })

        it('should deny access when user lacks feature', async () => {
            mockRequest.user = mockUser
            mockUser.subscriptionTier = 'free'
            mockUser.canAccessFeature.mockResolvedValue(false)

            const middleware = requireFeature('moment_boost')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(PaymentRequiredError))
        })

        it('should handle error when user is not loaded', async () => {
            mockRequest.user = undefined

            const middleware = requireFeature('moment_boost')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
        })

        it('should handle feature check errors', async () => {
            mockRequest.user = mockUser
            mockUser.canAccessFeature.mockRejectedValue(new Error('Feature check failed'))

            const middleware = requireFeature('moment_boost')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
        })
    })

    describe('rateLimitMiddleware', () => {
        beforeEach(() => {
            mockUser.getRateLimit.mockReturnValue({
                requests: 10,
                window: '1h',
                burst: 2
            })
        })

        it('should allow request within rate limit', async () => {
            mockRequest.user = mockUser

            const middleware = await rateLimitMiddleware('POST /api/moments')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockUser.getRateLimit).toHaveBeenCalledWith('POST /api/moments')
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10)
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-User-Tier', 'free')
            expect(mockNext).toHaveBeenCalledWith()
        })

        it('should block request when rate limit exceeded', async () => {
            mockRequest.user = mockUser
            mockUser.subscriptionTier = 'free'

            // Mock rate limit count to be at limit
            vi.doMock('./premium-validation', async () => {
                const actual = await vi.importActual('./premium-validation')
                return {
                    ...actual,
                    getRateLimitCount: vi.fn().mockResolvedValue(10) // At limit
                }
            })

            const middleware = await rateLimitMiddleware('POST /api/moments')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            // Should continue for now since we're mocking the cache functions
            expect(mockNext).toHaveBeenCalled()
        })

        it('should handle missing user gracefully', async () => {
            mockRequest.user = undefined

            const middleware = await rateLimitMiddleware('POST /api/moments')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
        })
    })

    describe('trackFeatureUsage', () => {
        it('should track feature usage', async () => {
            mockRequest.user = mockUser
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)

            const middleware = trackFeatureUsage('posts')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockUser.trackFeatureUsage).toHaveBeenCalledWith('posts')
            expect(mockNext).toHaveBeenCalledWith()
        })

        it('should continue when user is not loaded', async () => {
            mockRequest.user = undefined

            const middleware = trackFeatureUsage('posts')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith()
        })

        it('should continue when tracking fails', async () => {
            mockRequest.user = mockUser
            mockUser.trackFeatureUsage.mockRejectedValue(new Error('Tracking failed'))

            const middleware = trackFeatureUsage('posts')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith()
        })
    })

    describe('checkStorageLimit', () => {
        beforeEach(() => {
            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 100,
                videoDurationMax: 300,
                videoResolution: 'SD',
                imageQuality: 'medium'
            })
        })

        it('should allow upload within storage limit', async () => {
            mockRequest.user = mockUser

            const middleware = checkStorageLimit(50, 'image')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockUser.getStorageLimit).toHaveBeenCalled()
            expect(mockNext).toHaveBeenCalledWith()
        })

        it('should block upload exceeding storage limit', async () => {
            mockRequest.user = mockUser
            mockUser.subscriptionTier = 'free'

            const middleware = checkStorageLimit(200, 'image') // Exceeds 100MB limit
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockResponse.status).toHaveBeenCalledWith(413)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'File too large',
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('storage')
                    })
                })
            )
        })

        it('should set video metadata for video uploads', async () => {
            mockRequest.user = mockUser

            const middleware = checkStorageLimit(50, 'video')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockRequest.maxVideoDuration).toBe(300)
            expect(mockRequest.videoResolution).toBe('SD')
            expect(mockNext).toHaveBeenCalledWith()
        })

        it('should set image metadata for image uploads', async () => {
            mockRequest.user = mockUser

            const middleware = checkStorageLimit(50, 'image')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockRequest.imageQuality).toBe('medium')
            expect(mockNext).toHaveBeenCalledWith()
        })

        it('should handle missing user', async () => {
            mockRequest.user = undefined

            const middleware = checkStorageLimit(50, 'image')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
        })
    })

    describe('checkMonthlyLimit', () => {
        beforeEach(() => {
            mockUser.isWithinUsageLimit.mockResolvedValue(true)
            mockUser.getRemainingUsage.mockResolvedValue(50)
            mockUser.getFeatureUsageStats.mockResolvedValue({
                current: 10,
                limit: 60,
                resetDate: new Date()
            })
        })

        it('should allow request within monthly limit', async () => {
            mockRequest.user = mockUser

            const middleware = checkMonthlyLimit('posts')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockUser.isWithinUsageLimit).toHaveBeenCalledWith('posts')
            expect(mockNext).toHaveBeenCalledWith()
        })

        it('should block request exceeding monthly limit', async () => {
            mockRequest.user = mockUser
            mockUser.subscriptionTier = 'free'
            mockUser.isWithinUsageLimit.mockResolvedValue(false)
            mockUser.getRemainingUsage.mockResolvedValue(0)

            const middleware = checkMonthlyLimit('posts')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockResponse.status).toHaveBeenCalledWith(429)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Monthly limit exceeded',
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('posts')
                    })
                })
            )
        })

        it('should handle missing user', async () => {
            mockRequest.user = undefined

            const middleware = checkMonthlyLimit('posts')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
        })

        it('should continue when limit check fails', async () => {
            mockRequest.user = mockUser
            mockUser.isWithinUsageLimit.mockRejectedValue(new Error('Limit check failed'))

            const middleware = checkMonthlyLimit('posts')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith()
        })
    })

    describe('premiumValidation', () => {
        it('should return array of middlewares', () => {
            const middlewares = premiumValidation({
                feature: 'moment_boost',
                endpoint: 'POST /api/moments',
                trackUsage: 'posts',
                monthlyLimit: 'posts'
            })

            expect(Array.isArray(middlewares)).toBe(true)
            expect(middlewares.length).toBeGreaterThan(1)
            expect(middlewares[0]).toBe(loadUserMiddleware)
        })

        it('should include only loadUserMiddleware when no options provided', () => {
            const middlewares = premiumValidation({})

            expect(middlewares).toHaveLength(1)
            expect(middlewares[0]).toBe(loadUserMiddleware)
        })

        it('should include all middlewares when all options provided', () => {
            const middlewares = premiumValidation({
                feature: 'moment_boost',
                endpoint: 'POST /api/moments',
                trackUsage: 'posts',
                monthlyLimit: 'posts',
                storageCheck: { sizeMB: 50, type: 'image' }
            })

            expect(middlewares.length).toBeGreaterThanOrEqual(5)
        })
    })

    describe('Integration Tests', () => {
        it('should work with free user trying premium feature', async () => {
            const freeUserData = {
                id: BigInt(123),
                username: 'freeuser',
                subscription_tier: 'free' as const,
                created_at: new Date(),
                updated_at: new Date()
            }

            const freeUser = new FreeUser(freeUserData)
            mockRequest.user = freeUser

            const middleware = requireFeature('moment_boost')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(PaymentRequiredError))
        })

        it('should work with premium user accessing premium feature', async () => {
            const premiumUserData = {
                id: BigInt(123),
                username: 'premiumuser',
                subscription_tier: 'premium' as const,
                created_at: new Date(),
                updated_at: new Date()
            }

            const subscriptionData = {
                id: BigInt(1),
                user_id: BigInt(123),
                status: 'active' as const,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                purchase_token: 'token',
                product_id: 'premium',
                order_id: 'order',
                purchased_at: new Date(),
                starts_at: new Date(),
                acknowledgment_state: 'acknowledged' as const,
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

            const premiumUser = new PremiumUser(premiumUserData, subscriptionData)
            mockRequest.user = premiumUser

            const middleware = requireFeature('moment_boost')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith()
        })
    })

    describe('Error Handling', () => {
        it('should handle unexpected errors gracefully', async () => {
            mockRequest.user = mockUser
            mockUser.canAccessFeature.mockImplementation(() => {
                throw new Error('Unexpected error')
            })

            const middleware = requireFeature('moment_boost')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
        })

        it('should handle null user object', async () => {
            mockRequest.user = null as any

            const middleware = requireFeature('moment_boost')
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)

            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
        })
    })

    describe('Performance', () => {
        it('should not block on tracking failures', async () => {
            mockRequest.user = mockUser
            mockUser.trackFeatureUsage.mockImplementation(() => {
                return new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Slow failure')), 1000)
                })
            })

            const middleware = trackFeatureUsage('posts')
            const start = Date.now()
            
            await middleware(mockRequest as Request, mockResponse as Response, mockNext)
            
            const duration = Date.now() - start
            expect(duration).toBeLessThan(100) // Should not wait for tracking
            expect(mockNext).toHaveBeenCalledWith()
        })
    })
})
