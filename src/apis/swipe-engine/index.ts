import axios from "axios"
import config from "../../config"

export const swipeEngineApi = axios.create({
    baseURL: config.CIRCLE_SWIPE_ENGINE_API,
})
