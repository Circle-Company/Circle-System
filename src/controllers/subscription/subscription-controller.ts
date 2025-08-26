import {
    activate_subscription,
    revalidate_subscription,
    cancel_subscription
} from "./subscription-actions-controller"
import {
    get_subscription_status,
    get_subscription_history,
    get_validation_logs,
    check_feature_access,
    get_available_features,
    get_admin_stats
} from "./subscription-find-controller"
import {
    advanced_search,
    advanced_analytics,
    moment_boost,
    profile_highlight
} from "./subscription-premium-controller"

export const SubscriptionController = {
    ActivateSubscription: activate_subscription,
    GetSubscriptionStatus: get_subscription_status,
    GetSubscriptionHistory: get_subscription_history,
    RevalidateSubscription: revalidate_subscription,
    CancelSubscription: cancel_subscription,
    GetValidationLogs: get_validation_logs,
    CheckFeatureAccess: check_feature_access,
    GetAvailableFeatures: get_available_features,
    GetAdminStats: get_admin_stats,
    AdvancedSearch: advanced_search,
    AdvancedAnalytics: advanced_analytics,
    MomentBoost: moment_boost,
    ProfileHighlight: profile_highlight
}
