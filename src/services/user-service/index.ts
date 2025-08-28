import {
    block_user,
    follow_user,
    report_user,
    unfollow_user,
    unlock_user,
} from "./user-actions-service"
import {
    find_session_user_by_pk,
    find_session_user_statistics_by_pk,
    find_user_by_pk,
    find_user_by_username,
    find_user_data,
    find_user_followers,
    search_user,
} from "./user-find-service"

// Exportar classes do sistema de usuários
export { BaseUser } from "../../classes/user/BaseUser"
export { FreeUser } from "../../classes/user/freeUser"
export { PremiumUser } from "../../classes/user/premiumUser"
export { UserFactory } from "../../classes/user/UserFactory"
export { FeatureUsageService } from "../../classes/plans/FeatureUsageService"

// Exportar todos os tipos
export * from "./types"

// Serviço tradicional mantido para compatibilidade
export const UserService = {
    UserActions: {
        FollowUser: follow_user,
        UnfollowUser: unfollow_user,
        BlockUser: block_user,
        UnlockUser: unlock_user,
        ReportUser: report_user,
    },
    UserFind: {
        FinduserFollowers: find_user_followers,
        FindByUsername: find_user_by_username,
        FindAllData: find_user_data,
        SearchUser: search_user,
        FindByPk: find_user_by_pk,
        FindSessionStatisticsByPk: find_session_user_statistics_by_pk,
        FindSessionByPk: find_session_user_by_pk,
    },
    // Novos métodos usando classes
    UserFactory: {
        CreateUser: UserFactory.createUser,
        CreateUserFromData: UserFactory.createUserFromData,
        CreateMultipleUsers: UserFactory.createMultipleUsers,
        CreateUserSafe: UserFactory.createUserSafe,
        ReloadUser: UserFactory.reloadUser,
        ClearCache: UserFactory.clearCache,
        GetCacheStats: UserFactory.getCacheStats,
        WarmUpCache: UserFactory.warmUpCache,
    },
    FeatureUsage: {
        Track: FeatureUsageService.track,
        GetUsage: FeatureUsageService.getUsage,
        GetStats: FeatureUsageService.getStats,
        ResetUsage: FeatureUsageService.resetUsage,
        GetAllUsage: FeatureUsageService.getAllUsage,
        CleanupOldUsage: FeatureUsageService.cleanupOldUsage,
    }
}
