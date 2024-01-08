import config from "./index"

const API_VERISON_PREFIX = "/" + "v" + config.API_VERSION

// RP = Routes Prefixes
export const RP = {
    API_VERISON: API_VERISON_PREFIX,
    AUTH: "/auth",
    USER: '/user',
    PROFILE: '/profile',
    ADMIN: '/admin',
    ACCOUNT: '/account',
    EDIT: '/edit',
    DELETE: '/delete',
}