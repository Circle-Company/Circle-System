import {
    set_add_to_memory_push_notification,
    set_app_language,
    set_autoplay,
    set_follow_user_push_notification,
    set_haptics,
    set_like_moment_push_notification,
    set_new_memory_push_notification,
    set_translation,
    set_translation_language,
    set_view_user_push_notification,
} from "./preferences-actions-controller"
import { get_user_preferences } from "./preferences-find-controller"

export const PreferencesController = {
    Find: get_user_preferences,
    AppLanguage: set_app_language,
    TranslationLanguage: set_translation_language,
    SetAutoplay: set_autoplay,
    SetHaptics: set_haptics,
    SetTranslation: set_translation,
    PushNotification: {
        SetLikeMoment: set_like_moment_push_notification,
        SetNewMemory: set_new_memory_push_notification,
        SetAddToMemory: set_add_to_memory_push_notification,
        SetFollowUser: set_follow_user_push_notification,
        SetViewUser: set_view_user_push_notification,
    },
}
