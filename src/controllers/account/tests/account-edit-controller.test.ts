import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Request, Response } from 'express'
import { edit_user_description, edit_profile_picture } from '../account-edit-controller'

// Mock dependencies
vi.mock('../../../classes/user/UserFactory', () => ({
    UserFactory: {
        createUser: vi.fn()
    }
}))

vi.mock('../../../services/account-service', () => ({
    AccountService: {
        AccountEdit: {
            EditUserDescription: vi.fn(),
            EditProfilePicture: vi.fn()
        }
    }
}))

describe('Account Edit Controller - Premium Features', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>
    let mockUser: any

    beforeEach(() => {
        mockRequest = {
            user_id: BigInt(123),
            user: undefined,
            body: {},
            file: undefined
        }

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        }

        mockUser = {
            id: BigInt(123),
            username: 'testuser',
            subscriptionTier: 'premium',
            getStorageLimit: vi.fn(),
            canAccessFeature: vi.fn(),
            trackFeatureUsage: vi.fn()
        }
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('edit_user_description', () => {
        beforeEach(() => {
            mockRequest.body = {
                description: 'This is a test description'
            }
            
            const { AccountService } = require('../../../services/account-service')
            vi.mocked(AccountService.AccountEdit.EditUserDescription).mockResolvedValue({ success: true })
        })

        it('should allow normal description for free user', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'free'
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)

            await edit_user_description(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true
                })
            )
        })

        it('should block long description for free user', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockRequest.body.description = 'A'.repeat(200) // Longer than free limit (160)
            mockUser.subscriptionTier = 'free'
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)

            await edit_user_description(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Description too long',
                    max_length: 160,
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('more about yourself')
                    })
                })
            )
        })

        it('should allow long description for premium user', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockRequest.body.description = 'A'.repeat(400) // Within premium limit (500)
            mockUser.subscriptionTier = 'premium'
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)

            await edit_user_description(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true
                })
            )
        })

        it('should block extremely long description even for premium user', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockRequest.body.description = 'A'.repeat(600) // Longer than premium limit (500)
            mockUser.subscriptionTier = 'premium'
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)

            await edit_user_description(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Description too long',
                    max_length: 500
                })
            )
        })

        it('should handle missing user_id', async () => {
            mockRequest.user_id = undefined

            await edit_user_description(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
        })

        it('should work without user validation if not loaded', async () => {
            mockRequest.user = undefined

            await edit_user_description(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })

        it('should handle service errors', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            const { AccountService } = require('../../../services/account-service')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            vi.mocked(AccountService.AccountEdit.EditUserDescription).mockRejectedValue(new Error('Service error'))

            await edit_user_description(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
        })
    })

    describe('edit_profile_picture', () => {
        beforeEach(() => {
            mockRequest.file = {
                filename: 'test.jpg',
                size: 1024 * 1024, // 1MB
                mimetype: 'image/jpeg',
                originalname: 'profile.jpg',
                buffer: Buffer.from('fake image data')
            } as any

            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 100,
                imageQuality: 'medium'
            })

            const { AccountService } = require('../../../services/account-service')
            vi.mocked(AccountService.AccountEdit.EditProfilePicture).mockResolvedValue({ 
                success: true,
                image_url: 'https://example.com/image.jpg'
            })
        })

        it('should upload image with correct quality for free user', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'free'
            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 100,
                imageQuality: 'medium'
            })
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockUser.trackFeatureUsage).toHaveBeenCalledWith('profile_picture_updates')
            expect(mockRequest.imageQuality).toBe('medium')
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    image_url: 'https://example.com/image.jpg'
                })
            )
        })

        it('should upload image with high quality for premium user', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'premium'
            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 10000,
                imageQuality: 'high'
            })
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockRequest.imageQuality).toBe('high')
            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })

        it('should block large files for free user', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockRequest.file!.size = 10 * 1024 * 1024 // 10MB - larger than free limit
            mockUser.subscriptionTier = 'free'
            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 100,
                imageQuality: 'medium'
            })
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(413)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'File too large',
                    max_size_mb: expect.any(Number),
                    upgrade_suggestion: expect.objectContaining({
                        title: expect.stringContaining('higher quality')
                    })
                })
            )
        })

        it('should allow large files for premium user', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockRequest.file!.size = 8 * 1024 * 1024 // 8MB - within premium limit
            mockUser.subscriptionTier = 'premium'
            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 10000,
                imageQuality: 'high'
            })
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })

        it('should handle missing file', async () => {
            mockRequest.file = undefined

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'No file uploaded'
                })
            )
        })

        it('should handle invalid file types', async () => {
            mockRequest.file!.mimetype = 'text/plain'

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Invalid file type',
                    allowed_types: expect.arrayContaining(['image/jpeg', 'image/png'])
                })
            )
        })

        it('should handle missing user_id', async () => {
            mockRequest.user_id = undefined

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
        })

        it('should work without user validation if not loaded', async () => {
            mockRequest.user = undefined

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })

        it('should handle service errors', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            const { AccountService } = require('../../../services/account-service')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)
            vi.mocked(AccountService.AccountEdit.EditProfilePicture).mockRejectedValue(new Error('Upload failed'))

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
        })
    })

    describe('File Size Calculations', () => {
        beforeEach(() => {
            mockRequest.file = {
                filename: 'test.jpg',
                size: 1024 * 1024, // 1MB
                mimetype: 'image/jpeg',
                originalname: 'profile.jpg',
                buffer: Buffer.from('fake image data')
            } as any
        })

        it('should calculate file size in MB correctly for free user', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'free'
            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 100,
                imageQuality: 'medium'
            })
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)

            // Set file size to exactly 5MB (free limit)
            mockRequest.file!.size = 5 * 1024 * 1024

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200) // Should be allowed at limit
        })

        it('should calculate file size in MB correctly for premium user', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'premium'
            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 10000,
                imageQuality: 'high'
            })
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)

            // Set file size to exactly 10MB (premium limit)
            mockRequest.file!.size = 10 * 1024 * 1024

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200) // Should be allowed at limit
        })

        it('should reject files exceeding the byte limit by 1', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            mockUser.subscriptionTier = 'free'
            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 100,
                imageQuality: 'medium'
            })
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)

            // Set file size to 1 byte over the 5MB free limit
            mockRequest.file!.size = (5 * 1024 * 1024) + 1

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(413)
        })
    })

    describe('Feature Usage Tracking', () => {
        beforeEach(() => {
            mockRequest.file = {
                filename: 'test.jpg',
                size: 1024 * 1024, // 1MB
                mimetype: 'image/jpeg',
                originalname: 'profile.jpg',
                buffer: Buffer.from('fake image data')
            } as any

            const { AccountService } = require('../../../services/account-service')
            vi.mocked(AccountService.AccountEdit.EditProfilePicture).mockResolvedValue({ 
                success: true,
                image_url: 'https://example.com/image.jpg'
            })
        })

        it('should track profile picture updates', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 100,
                imageQuality: 'medium'
            })
            mockUser.trackFeatureUsage.mockResolvedValue(undefined)

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockUser.trackFeatureUsage).toHaveBeenCalledWith('profile_picture_updates')
        })

        it('should continue even if tracking fails', async () => {
            const { UserFactory } = await import('../../../classes/user/UserFactory')
            
            vi.mocked(UserFactory.createUser).mockResolvedValue(mockUser as any)
            mockUser.getStorageLimit.mockReturnValue({
                totalMB: 100,
                imageQuality: 'medium'
            })
            mockUser.trackFeatureUsage.mockRejectedValue(new Error('Tracking failed'))

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200) // Should still succeed
        })
    })

    describe('Edge Cases', () => {
        it('should handle zero-byte files', async () => {
            mockRequest.file = {
                filename: 'empty.jpg',
                size: 0,
                mimetype: 'image/jpeg',
                originalname: 'empty.jpg',
                buffer: Buffer.alloc(0)
            } as any

            await edit_profile_picture(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'File is empty'
                })
            )
        })

        it('should handle empty description', async () => {
            mockRequest.body = { description: '' }

            await edit_user_description(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200) // Empty should be allowed
        })

        it('should handle null description', async () => {
            mockRequest.body = { description: null }

            await edit_user_description(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Description is required'
                })
            )
        })
    })
})
