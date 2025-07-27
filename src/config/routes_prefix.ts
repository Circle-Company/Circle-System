import config from "./index"

const API_VERISON_PREFIX = "/" + "v" + config.API_VERSION

// RP = Routes Prefixes
export const RP = {
    API_VERISON: API_VERISON_PREFIX,
    API_V2: "/v2",
    NEAR: "/near",
    AUTH: "/auth",
    USER: "/user",
    USERS: "/users",
    MOMENT: "/moment",
    MOMENTS: "/moments",
    MEMORY: "/memory",
    MEMORIES: "/memories",
    PROFILE: "/profile",
    REPORT: "/report",
    NOTIFICATION: "/notification",
    NOTIFICATIONS: "/notifications",
    PUSH_NOTIFICATION: "/push-notification",
    PUSH_NOTIFICATIONS: "/push-notifications",
    PREFERENCES: "/preferences",
    ADMIN: "/admin",
    MODERATOR: "/moderator",
    ACCOUNT: "/account",
    EDIT: "/edit",
    DELETE: "/delete",
    LIST: "/list",
    SWIPE_ENGINE: "/swipe-engine",
    METRICS: "/metrics",
}
