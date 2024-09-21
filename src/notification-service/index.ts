import { ADMIN } from "../config/firebase"
import { Module as CreateNotificationOnDb } from "./modules/create-on-db"
import { Module as NotificationData } from "./modules/notification-data"
import { Module as ReceiverUsersList } from "./modules/receiver-users"
import { Module as VerifyUsersPermissions } from "./modules/verify-receiver-permissions"
import { NotificationProps } from "./types"

type TriggerNotificationType = {
    notification: NotificationProps
}
export async function TriggerNotification({ notification }: TriggerNotificationType) {
    const { notificationData } = await NotificationData({ notification })
    const usersList = await ReceiverUsersList({ notification })
    const usersWithPermission = await VerifyUsersPermissions({ notification, usersList })
    const cleanedUsersList = usersWithPermission.filter((user) => user?.token !== null)

    const message: any = {
        tokens: cleanedUsersList.map((user) => {
            return user?.token
        }),
        android: {
            data: {
                user: JSON.stringify(notificationData.senderUser),
                media: JSON.stringify(notificationData.media),
            },
            notification: {
                title: notificationData.title,
                body: notificationData.body,
                icon: "ic_stat_transparent",
                color: notificationData.color,
            },
        },
    }

    if (cleanedUsersList.length > 0) {
        await ADMIN.messaging()
            .sendEachForMulticast(message)
            .then(async (response) => {
                console.log("Successfully sent message:", JSON.stringify(response))
                await CreateNotificationOnDb({ notification })
            })
            .catch((error) => {
                console.log("Error sending message:", JSON.stringify(error))
            })
    }
}
