import { Router } from "express"
import { RP } from "../config/routes_prefix"
import { PreferencesController } from "../controllers/preferences"

export const router = Router()
const PUSH_NOTIFICATION_PREFIX = RP.PUSH_NOTIFICATION

router.get("/get/:user_id", PreferencesController.Find)
router.put("/app-language", PreferencesController.AppLanguage)
router.put("/translation-language", PreferencesController.TranslationLanguage)
router.put("/autoplay", PreferencesController.SetAutoplay)
router.put("/haptics", PreferencesController.SetHaptics)
router.put("/translation", PreferencesController.SetTranslation)

router.put(
    PUSH_NOTIFICATION_PREFIX + "/like-moment",
    PreferencesController.PushNotification.SetLikeMoment
)
router.put(
    PUSH_NOTIFICATION_PREFIX + "/new-memory",
    PreferencesController.PushNotification.SetNewMemory
)
router.put(
    PUSH_NOTIFICATION_PREFIX + "/add-to-memory",
    PreferencesController.PushNotification.SetAddToMemory
)
router.put(
    PUSH_NOTIFICATION_PREFIX + "/follow-user",
    PreferencesController.PushNotification.SetFollowUser
)
router.put(
    PUSH_NOTIFICATION_PREFIX + "/view-user",
    PreferencesController.PushNotification.SetViewUser
)
