import { Router } from "express"
import { SubscriptionController } from "../controllers/subscription/subscription-controller"
import { GooglePlayWebhookController } from "../controllers/webhook/google-play-webhook"
import {
    requirePremiumSubscription,
    requireFeatureAccess,
    checkSubscriptionRateLimit,
    checkMonthlyLimit,
    addSubscriptionInfo,
    validateGooglePlayWebhook,
    webhookRateLimit
} from '../middlewares/subscription-middleware'

export const router = Router()

// ==================== ROTAS DE ASSINATURA ====================

router.post('/activate', 
    checkSubscriptionRateLimit('POST /api/subscription/activate'),
    SubscriptionController.ActivateSubscription
)

router.get('/status',
    addSubscriptionInfo,
    SubscriptionController.GetSubscriptionStatus
)

router.get('/history',
    checkSubscriptionRateLimit('GET /api/subscription/history'),
    SubscriptionController.GetSubscriptionHistory
)

router.post('/:id/revalidate',
    checkSubscriptionRateLimit('POST /api/subscription/revalidate'),
    SubscriptionController.RevalidateSubscription
)

router.post('/:id/cancel',
    checkSubscriptionRateLimit('POST /api/subscription/cancel'),
    SubscriptionController.CancelSubscription
)

router.get('/:id/logs',
    requirePremiumSubscription,
    SubscriptionController.GetValidationLogs
)

// ==================== ROTAS PREMIUM ====================

router.get('/feature/:featureName/check',
    SubscriptionController.CheckFeatureAccess
)

router.get('/features',
    addSubscriptionInfo,
    SubscriptionController.GetAvailableFeatures
)

// ==================== ROTAS ADMINISTRATIVAS ====================

router.get('/admin/stats',
    // TODO: Adicionar middleware de verificação de admin
    SubscriptionController.GetAdminStats
)

// ==================== WEBHOOK DO GOOGLE PLAY ====================

router.post('/webhook/google-play',
    webhookRateLimit,
    validateGooglePlayWebhook,
    GooglePlayWebhookController.HandleGooglePlayWebhook
)

// ==================== ROTAS DE EXEMPLO DE FEATURES PREMIUM ====================

router.get('/premium/advanced-search',
    requireFeatureAccess('advanced_search'),
    checkMonthlyLimit('searches'),
    SubscriptionController.AdvancedSearch
)

router.get('/premium/analytics',
    requireFeatureAccess('analytics_advanced'),
    SubscriptionController.AdvancedAnalytics
)

router.post('/premium/moment-boost',
    requireFeatureAccess('moment_boost'),
    checkMonthlyLimit('boosts'),
    SubscriptionController.MomentBoost
)

router.post('/premium/profile-highlight',
    requireFeatureAccess('profile_highlight'),
    checkMonthlyLimit('profile_highlights'),
    SubscriptionController.ProfileHighlight
)
