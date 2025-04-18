import Preference from "../../../models/preference/preference-model"
import { NotificationProps } from "../../types"

type User = {
    id: bigint
    token: string
}

type ModuleProps = {
    usersList: User[]
    notification: NotificationProps
}

export async function Module({
    usersList,
    notification,
}: ModuleProps): Promise<(User | null | undefined)[]> {
    const results = await Promise.all(
        usersList.map(async (user) => {
            // @ts-ignore
            const userPreferences = (await Preference.findOne({
                where: { user_id: user.id },
                attributes: [
                    "disable_like_moment_push_notification",
                    "disable_new_memory_push_notification",
                    "disable_add_to_memory_push_notification",
                    "disable_follow_user_push_notification",
                    "disable_view_user_push_notification",
                    "disable_news_push_notification",
                    "disable_sugestions_push_notification",
                    "disable_around_you_push_notification",
                ],
            })) as any

            if (!userPreferences) {
                throw new Error(`Preferences not found for user ID: ${user.id}`)
            }

            const userPreferencesObj = {
                disableLikeMoment: userPreferences.disable_like_moment_push_notification,
                disableNewMemory: userPreferences.disable_new_memory_push_notification,
                disableAddToMemory: userPreferences.disable_add_to_memory_push_notification,
                disableFollowUser: userPreferences.disable_follow_user_push_notification,
                disableViewUser: userPreferences.disable_view_user_push_notification,
                disableNews: userPreferences.disable_news_push_notification,
                disableSugestions: userPreferences.disable_sugestions_push_notification,
                disableAroundYou: userPreferences.disable_around_you_push_notification,
            }

            if (notification.type == "LIKE-MOMENT") {
                if (userPreferencesObj.disableLikeMoment == false) return user
                else return null
            }
            if (notification.type == "NEW-MEMORY") {
                if (userPreferencesObj.disableNewMemory == false) return user
                else return null
            }
            if (notification.type == "ADD-TO-MEMORY") {
                if (userPreferencesObj.disableAddToMemory == false) return user
                else return null
            }
            if (notification.type == "FOLLOW-USER") {
                if (userPreferencesObj.disableFollowUser == false) return user
                else return null
            }
            if (notification.type == "VIEW-USER") {
                if (userPreferencesObj.disableViewUser == false) return user
                else return null
            }
        })
    )

    return results.filter((value) => value !== null)
}
