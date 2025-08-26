import { beforeAll, afterAll, afterEach, vi } from 'vitest'

// Configure test environment
process.env.NODE_ENV = 'test'
process.env.VITEST_POOL_ID = '1'

// Increase event listener limit to avoid warnings in tests
require('events').EventEmitter.defaultMaxListeners = 50

// Mock required environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-vitest-testing'
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.AWS_ACCESS_KEY_ID = 'test-aws-access-key'
process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret-key'
process.env.AWS_REGION = 'us-east-1'
process.env.S3_BUCKET_NAME = 'test-bucket'
process.env.GOOGLE_PLAY_API_KEY = 'test-google-play-api-key'
process.env.GOOGLE_PLAY_PACKAGE_NAME = 'com.test.app'
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid'
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!'
process.env.PORT = '3000'
process.env.HOST = 'localhost'
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '3306'
process.env.DB_USER = 'test'
process.env.DB_PASS = 'test'
process.env.DB_NAME = 'test_db'
process.env.GOOGLE_PLAY_PUBLIC_KEY = 'test-google-play-public-key'
process.env.GOOGLE_PLAY_PRIVATE_KEY = 'test-google-play-private-key'
process.env.GOOGLE_PLAY_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com'
process.env.GOOGLE_PLAY_PROJECT_ID = 'test-project-123'

// Global test setup
beforeAll(async () => {
    // Mock console methods to reduce noise in tests (but preserve errors)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    
    // Set up global mocks for common external dependencies
    Object.defineProperty(global, 'fetch', {
        value: vi.fn(),
        writable: true
    })
    
    // Mock database connection
    vi.mock('./src/database/index.js', () => ({
        connection: {
            authenticate: vi.fn().mockResolvedValue(true),
            close: vi.fn().mockResolvedValue(true),
            sync: vi.fn().mockResolvedValue(true),
            models: {}
        }
    }))
    
    // Mock AWS SDK
    vi.mock('aws-sdk', () => ({
        S3: vi.fn().mockImplementation(() => ({
            upload: vi.fn().mockReturnThis(),
            promise: vi.fn().mockResolvedValue({ Location: 'mock-url' })
        }))
    }))
    
    // Mock Google APIs
    vi.mock('googleapis', () => ({
        google: {
            auth: {
                GoogleAuth: vi.fn().mockImplementation(() => ({
                    getClient: vi.fn().mockResolvedValue({})
                }))
            },
            androidpublisher: vi.fn().mockReturnValue({
                purchases: {
                    subscriptions: {
                        get: vi.fn().mockResolvedValue({
                            data: {
                                startTimeMillis: Date.now().toString(),
                                expiryTimeMillis: (Date.now() + 30 * 24 * 60 * 60 * 1000).toString(),
                                autoRenewing: true,
                                paymentState: 1,
                                acknowledgementState: 1
                            }
                        }),
                        acknowledge: vi.fn().mockResolvedValue({})
                    }
                }
            })
        }
    }))
    
    // Mock cron
    vi.mock('node-cron', () => ({
        schedule: vi.fn(),
        destroy: vi.fn()
    }))
    
    // Mock project services that may not exist
    vi.mock('./src/services/moment-service', () => ({
        MomentService: {
            Actions: {
                Like: vi.fn().mockResolvedValue({ success: true }),
                CommentOnMoment: vi.fn().mockResolvedValue({ success: true })
            }
        }
    }))
    
    vi.mock('./src/services/user-service', () => ({
        UserService: {
            UserFind: {
                FindAllData: vi.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
                SearchUser: vi.fn().mockResolvedValue({ users: [], total: 0 })
            }
        }
    }))
    
    vi.mock('./src/services/near-service', () => ({
        NearService: {
            Find: {
                FindNearbyUsers: vi.fn().mockResolvedValue([])
            }
        }
    }))
    
    // Mock crypto for webhook signatures
    vi.mock('crypto', async () => {
        const actual = await vi.importActual('crypto')
        return {
            ...actual,
            createVerify: vi.fn().mockReturnValue({
                update: vi.fn(),
                verify: vi.fn().mockReturnValue(true)
            })
        }
    })
    
    // Global utilities for tests
    Object.defineProperty(global, 'waitFor', {
        value: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
        writable: true
    })
    
    // Mock Sequelize models with basic functionality
    Object.defineProperty(global, 'mockSequelize', {
        value: {
            query: vi.fn().mockResolvedValue([[]]),
            literal: (str: string) => str,
            models: {},
            random: () => ({}),
            Op: {
                gt: Symbol('gt'),
                lt: Symbol('lt'),
                gte: Symbol('gte'),
                lte: Symbol('lte'),
                between: Symbol('between'),
                or: Symbol('or'),
                and: Symbol('and')
            }
        },
        writable: true
    })
})

afterEach(async () => {
    // Clear all mocks after each test
    vi.clearAllMocks()
    
    // Clear any timers
    vi.clearAllTimers()
    
    // Reset Date mock if used
    vi.useRealTimers()
    
    // Don't reset modules completely as it can cause issues with imports
    // vi.resetModules()
})

afterAll(async () => {
    // Restore all mocks
    vi.restoreAllMocks()
    
    // Clean up global state
    // Note: Global cleanup is handled by Vitest automatically
})

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
})
