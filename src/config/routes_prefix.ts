import config from "./index"

const prefix = "/" + "v" + config.API_VERSION

export const RP = {
    PREFIX: prefix,
    AUTH: "/auth",
    USER: '/user',
    ADMIN: '/admin',
    ACCOUNT: '/account',
}