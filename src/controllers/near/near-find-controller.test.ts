import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Request, Response } from 'express'
import { findNearbyUsers } from './near-find-controller'

// Mock dependencies
vi.mock('../../classes/user/UserFactory', () => ({
    UserFactory: {
        createUser: vi.fn()
    }
}))

vi.mock('../../services/near-service', () => ({
    NearService: {
        Find: {
            FindNearbyUsers: vi.fn()
        }
    }
}))

describe('Near Find Controller - Premium Features', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>
    let mockUser: any

    beforeEach(() => {
        mockRequest = {
            user_id: BigInt(123),
            user: undefined,
            body: {
                latitude: -23.5505,
                longitude: -46.6333,
                radius_km: 5
            }
        }

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        }

        mockUser = {
            id: BigInt(123),
            username: 'testuser',
            subscriptionTier: 'premium',
            canAccessFeature: vi.fn(),
            trackFeatureUsage: vi.fn(),
            isWithinUsageLimit: vi.fn(),
            getRemainingUsage: vi.fn()
        }
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('findNearbyUsers', () => {
        const mockNearbyUsers = [
            { id: BigInt(1), username: 'user1', distance_km: 1.2 },
            { id: BigInt(2), username: 'user2', distance_km: 3.5 }
        ]

        beforeEach(() => {
            const { NearService } = require('../../services/near-service')
            vi.mocked(NearService.Find.FindNearbyUsers).mockResolvedValue(mockNearbyUsers)
        })

        it('should allow location-based search for premium user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canAccessFeature.mockResolvedValue(true)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            mockUser.isWithinUsageLimit.mockResolvedValue(true)

            await findNearbyUsers(mockRequest as Request, mockResponse as Response)

            expect(mockUser.canAccessFeature).toHaveBeenCalledWith('location_search')
            expect(mockUser.trackFeatureUsage).toHaveBeenCalledWith('location_searches')
            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })

        it('should deny location-based search for free user', async () => {
            const { UserFactory } = await import('../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'free'
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.canAccessFeature.mockResolvedValue(false)

            await findNearbyUsers(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(402)
        })
    })
})