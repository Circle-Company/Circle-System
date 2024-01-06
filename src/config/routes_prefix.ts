import config from "./index"

const prefix = "/" + "v" + config.API_VERSION

export const RoutesPrefix = {
    AUTH: prefix + "/auth",
    USER: prefix + '/user',
    ACCOUNT: prefix + '/account',
}