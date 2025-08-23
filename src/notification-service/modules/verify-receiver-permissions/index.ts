import { NotificationProps } from "../../types"
import Preference from "../../../models/preference/preference-model"

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
            try {
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
                    console.log(`Preferences not found for user ID: ${user.id}, using defaults.`)
                    // Usar valores padrão (permitir todas as notificações) em vez de lançar erro
                    const userPreferencesObj = {
                        disableLikeMoment: false,
                        disableNewMemory: false,
                        disableAddToMemory: false,
                        disableFollowUser: false,
                        disableViewUser: false,
                        disableNews: false,
                        disableSugestions: false,
                        disableAroundYou: false,
                    }

                    // Aplicar a lógica com valores padrão
                    if (notification.type == "LIKE-MOMENT") {
                        return userPreferencesObj.disableLikeMoment ? null : user
                    }
                    if (notification.type == "NEW-MEMORY") {
                        return userPreferencesObj.disableNewMemory ? null : user
                    }
                    if (notification.type == "ADD-TO-MEMORY") {
                        return userPreferencesObj.disableAddToMemory ? null : user
                    }
                    if (notification.type == "FOLLOW-USER") {
                        return userPreferencesObj.disableFollowUser ? null : user
                    }
                    if (notification.type == "VIEW-USER") {
                        return userPreferencesObj.disableViewUser ? null : user
                    }

                    return user // Retorna o usuário para enviar notificação por padrão
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

                return null // Caso nenhuma condição corresponda
            } catch (error) {
                console.error(`Erro ao verificar preferências do usuário ID: ${user.id}`, error)
                return null // Em caso de erro, não envia notificação para este usuário
            }
        })
    )

    return results.filter((value) => value !== null)
}
