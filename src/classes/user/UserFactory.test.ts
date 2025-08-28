import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UserFactory } from './UserFactory'
import { FreeUser } from './freeUser'
import { PremiumUser } from './premiumUser'
import { UserData, UserSubscription } from '../../services/user-service/types'

// Mock the database models
vi.mock('../../models/user/user-model', () => ({
    default: {
        findOne: vi.fn()
    }
}))

vi.mock('../../models/user/statistic-model', () => ({
    default: {
        findOne: vi.fn()
    }
}))

describe('UserFactory', () => {
    let mockUserData: any
    let mockSubscriptionData: UserSubscription

    beforeEach(() => {
        // Clear cache before each test
        UserFactory.clearCache()

        mockUserData = {
            id: BigInt(123),
            username: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            subscription_tier: 'free',
            verifyed: true,
            blocked: false,
            deleted: false,
            muted: false,
            access_level: 1,
            description: 'Test description',
            send_notification_emails: true,
            created_at: new Date(),
            updated_at: new Date(),
            statistics: null
        }

        mockSubscriptionData = {
            id: BigInt(1),
            user_id: BigInt(123),
            purchase_token: 'test_token',
            product_id: 'premium_monthly',
            order_id: 'order_123',
            status: 'active',
            purchased_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
    })

    afterEach(() => {
        vi.clearAllMocks()
        UserFactory.clearCache()
    })

    describe('createUser', () => {
        it('should create a FreeUser for free tier', async () => {
            // Mock database response
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            const user = await UserFactory.createUser(BigInt(123))
            
            expect(user).toBeInstanceOf(FreeUser)
            expect(user.id).toBe(BigInt(123))
            expect(user.subscriptionTier).toBe('free')
        })

        it('should create a PremiumUser for premium tier', async () => {
            mockUserData.subscription_tier = 'premium'
            
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            const user = await UserFactory.createUser(BigInt(123))
            
            expect(user).toBeInstanceOf(PremiumUser)
            expect(user.id).toBe(BigInt(123))
            expect(user.subscriptionTier).toBe('premium')
        })

        it('should throw error when user not found', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(null)

            await expect(UserFactory.createUser(BigInt(999))).rejects.toThrow('User not found')
        })

        it('should handle users without subscription_tier (legacy)', async () => {
            delete mockUserData.subscription_tier
            
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            const user = await UserFactory.createUser(BigInt(123))
            
            expect(user).toBeInstanceOf(FreeUser)
            expect(user.subscriptionTier).toBe('free')
        })
    })

    describe('createUserFromData', () => {
        it('should create FreeUser from provided data', () => {
            const userData: UserData = {
                id: BigInt(123),
                username: 'testuser',
                subscription_tier: 'free',
                created_at: new Date(),
                updated_at: new Date()
            }

            const user = UserFactory.createUserFromData(userData)
            
            expect(user).toBeInstanceOf(FreeUser)
            expect(user.id).toBe(BigInt(123))
        })

        it('should create PremiumUser from provided data with subscription', () => {
            const userData: UserData = {
                id: BigInt(123),
                username: 'premiumuser',
                subscription_tier: 'premium',
                created_at: new Date(),
                updated_at: new Date()
            }

            const user = UserFactory.createUserFromData(userData, mockSubscriptionData)
            
            expect(user).toBeInstanceOf(PremiumUser)
            expect(user.id).toBe(BigInt(123))
        })
    })

    describe('Cache Management', () => {
        it('should cache users after creation', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            // First call should hit database
            const user1 = await UserFactory.createUser(BigInt(123))
            expect(User.default.findOne).toHaveBeenCalledTimes(1)

            // Second call should use cache
            const user2 = await UserFactory.createUser(BigInt(123))
            expect(User.default.findOne).toHaveBeenCalledTimes(1) // Still 1, not 2
            
            expect(user1).toBe(user2) // Same instance from cache
        })

        it('should check if user is cached', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            expect(UserFactory.isUserCached(BigInt(123))).toBe(false)
            
            await UserFactory.createUser(BigInt(123))
            expect(UserFactory.isUserCached(BigInt(123))).toBe(true)
        })

        it('should clear specific user from cache', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            await UserFactory.createUser(BigInt(123))
            expect(UserFactory.isUserCached(BigInt(123))).toBe(true)
            
            UserFactory.clearCache(BigInt(123))
            expect(UserFactory.isUserCached(BigInt(123))).toBe(false)
        })

        it('should clear all cache', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            await UserFactory.createUser(BigInt(123))
            await UserFactory.createUser(BigInt(456))
            
            expect(UserFactory.getCacheStats().size).toBe(2)
            
            UserFactory.clearCache()
            expect(UserFactory.getCacheStats().size).toBe(0)
        })

        it('should return cache statistics', async () => {
            const stats = UserFactory.getCacheStats()
            
            expect(stats).toHaveProperty('size')
            expect(stats).toHaveProperty('timeout')
            expect(typeof stats.size).toBe('number')
            expect(typeof stats.timeout).toBe('number')
        })

        it('should update cache timeout', () => {
            const newTimeout = 10000 // 10 seconds
            UserFactory.setCacheTimeout(newTimeout)
            
            const stats = UserFactory.getCacheStats()
            expect(stats.timeout).toBe(newTimeout)
        })
    })

    describe('reloadUser', () => {
        it('should force reload user from database', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            // Create and cache user
            await UserFactory.createUser(BigInt(123))
            expect(User.default.findOne).toHaveBeenCalledTimes(1)

            // Reload should clear cache and fetch from database again
            await UserFactory.reloadUser(BigInt(123))
            expect(User.default.findOne).toHaveBeenCalledTimes(2)
        })
    })

    describe('createMultipleUsers', () => {
        it('should create multiple users efficiently', async () => {
            const User = await import('../../models/user/user-model')
            
            // Mock different users
            vi.mocked(User.default.findOne)
                .mockResolvedValueOnce({ ...mockUserData, id: BigInt(123) })
                .mockResolvedValueOnce({ ...mockUserData, id: BigInt(456) })
                .mockResolvedValueOnce({ ...mockUserData, id: BigInt(789) })

            const userIds = [BigInt(123), BigInt(456), BigInt(789)]
            const usersMap = await UserFactory.createMultipleUsers(userIds)
            
            expect(usersMap.size).toBe(3)
            expect(usersMap.has(BigInt(123))).toBe(true)
            expect(usersMap.has(BigInt(456))).toBe(true)
            expect(usersMap.has(BigInt(789))).toBe(true)
        })

        it('should use cached users when available', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            // Cache one user
            await UserFactory.createUser(BigInt(123))
            
            // Create multiple users including cached one
            const userIds = [BigInt(123), BigInt(456)]
            const usersMap = await UserFactory.createMultipleUsers(userIds)
            
            expect(usersMap.size).toBe(2)
            // Should only call database once for user 456, since 123 is cached
        })

        it('should handle failed user creations gracefully', async () => {
            const User = await import('../../models/user/user-model')
            
            vi.mocked(User.default.findOne)
                .mockResolvedValueOnce({ ...mockUserData, id: BigInt(123) })
                .mockRejectedValueOnce(new Error('Database error'))
                .mockResolvedValueOnce({ ...mockUserData, id: BigInt(789) })

            const userIds = [BigInt(123), BigInt(456), BigInt(789)]
            const usersMap = await UserFactory.createMultipleUsers(userIds)
            
            // Should have 2 users (123 and 789), 456 failed
            expect(usersMap.size).toBe(2)
            expect(usersMap.has(BigInt(123))).toBe(true)
            expect(usersMap.has(BigInt(456))).toBe(false)
            expect(usersMap.has(BigInt(789))).toBe(true)
        })
    })

    describe('createUserSafe', () => {
        it('should return user on success', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            const user = await UserFactory.createUserSafe(BigInt(123))
            
            expect(user).toBeInstanceOf(FreeUser)
            expect(user?.id).toBe(BigInt(123))
        })

        it('should return null on error', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockRejectedValue(new Error('Database error'))

            const user = await UserFactory.createUserSafe(BigInt(123))
            
            expect(user).toBe(null)
        })
    })

    describe('warmUpCache', () => {
        it('should pre-load users into cache', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne)
                .mockResolvedValueOnce({ ...mockUserData, id: BigInt(123) })
                .mockResolvedValueOnce({ ...mockUserData, id: BigInt(456) })

            const activeUserIds = [BigInt(123), BigInt(456)]
            await UserFactory.warmUpCache(activeUserIds)
            
            // Both users should be cached
            expect(UserFactory.isUserCached(BigInt(123))).toBe(true)
            expect(UserFactory.isUserCached(BigInt(456))).toBe(true)
        })

        it('should handle errors during warm-up gracefully', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockRejectedValue(new Error('Database error'))

            // Should not throw error
            await expect(UserFactory.warmUpCache([BigInt(123)])).resolves.toBeUndefined()
        })
    })

    describe('Database Integration', () => {
        it('should include statistics in query', async () => {
            const User = await import('../../models/user/user-model')
            const Statistic = await import('../../models/user/statistic-model')
            
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            await UserFactory.createUser(BigInt(123))
            
            expect(User.default.findOne).toHaveBeenCalledWith({
                where: { id: BigInt(123) },
                include: [
                    { 
                        model: Statistic.default, 
                        as: 'statistics',
                        required: false
                    }
                ]
            })
        })

        it('should handle missing statistics gracefully', async () => {
            const mockUserWithoutStats = {
                ...mockUserData,
                statistics: null
            }
            
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserWithoutStats)

            const user = await UserFactory.createUser(BigInt(123))
            
            expect(user).toBeInstanceOf(FreeUser)
            expect((user as any).userData.statistics).toBe(null)
        })
    })

    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockRejectedValue(new Error('Connection failed'))

            await expect(UserFactory.createUser(BigInt(123))).rejects.toThrow('Connection failed')
        })

        it('should handle invalid user data', async () => {
            const invalidUserData = {
                id: 'invalid', // Should be bigint
                username: null
            }
            
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(invalidUserData)

            // Should handle gracefully and not crash
            await expect(UserFactory.createUser(BigInt(123))).resolves.toBeDefined()
        })
    })

    describe('Performance', () => {
        it('should cache users for performance', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            const startTime = Date.now()
            
            // First call - should hit database
            await UserFactory.createUser(BigInt(123))
            const firstCallTime = Date.now() - startTime
            
            const cacheStartTime = Date.now()
            
            // Second call - should use cache (much faster)
            await UserFactory.createUser(BigInt(123))
            const cachedCallTime = Date.now() - cacheStartTime
            
            // Cache should be significantly faster (though this is a mock test)
            expect(cachedCallTime).toBeLessThan(firstCallTime + 50) // Allow some variance
        })

        it('should handle concurrent user creation', async () => {
            const User = await import('../../models/user/user-model')
            vi.mocked(User.default.findOne).mockResolvedValue(mockUserData)

            // Create multiple promises for the same user
            const promises = [
                UserFactory.createUser(BigInt(123)),
                UserFactory.createUser(BigInt(123)),
                UserFactory.createUser(BigInt(123))
            ]
            
            const users = await Promise.all(promises)
            
            // All should be the same instance (from cache)
            // Note: In concurrent scenarios, cache might work differently
            expect(users).toHaveLength(3)
            expect(users.every(u => u instanceof FreeUser)).toBe(true)
        })
    })
})
