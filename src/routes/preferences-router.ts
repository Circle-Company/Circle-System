import { Router } from "express"
import { RP } from "../config/routes_prefix"
import { PreferencesController } from "../controllers/preferences"
const preferencesRouter = Router()
const PREFERENCES_PREFIX = RP.API_VERISON + RP.PREFERENCES
const PUSH_NOTIFICATION_PREFIX = PREFERENCES_PREFIX + RP.PUSH_NOTIFICATION

//preferencesRouter.use(UserAuthenticationValidator)
preferencesRouter.put(PREFERENCES_PREFIX + "/app-language", PreferencesController.AppLanguage)
preferencesRouter.put(
    PREFERENCES_PREFIX + "/translation-language",
    PreferencesController.TranslationLanguage
)
preferencesRouter.put(PREFERENCES_PREFIX + "/autoplay", PreferencesController.SetAutoplay)
preferencesRouter.put(PREFERENCES_PREFIX + "/haptics", PreferencesController.SetHaptics)
preferencesRouter.put(PREFERENCES_PREFIX + "/translation", PreferencesController.SetTranslation)

preferencesRouter.put(
    PUSH_NOTIFICATION_PREFIX + "/like-moment",
    PreferencesController.PushNotification.SetLikeMoment
)
preferencesRouter.put(
    PUSH_NOTIFICATION_PREFIX + "/new-memory",
    PreferencesController.PushNotification.SetNewMemory
)
preferencesRouter.put(
    PUSH_NOTIFICATION_PREFIX + "/add-to-memory",
    PreferencesController.PushNotification.SetAddToMemory
)
preferencesRouter.put(
    PUSH_NOTIFICATION_PREFIX + "/follow-user",
    PreferencesController.PushNotification.SetFollowUser
)
preferencesRouter.put(
    PUSH_NOTIFICATION_PREFIX + "/view-user",
    PreferencesController.PushNotification.SetViewUser
)
module.exports = preferencesRouter
