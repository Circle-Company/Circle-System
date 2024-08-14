import { ADMIN } from "../config/firebase"
import { Module as CreateNotificationOnDb } from "./modules/create-on-db"
import { Module as NotificationData } from "./modules/notification-data"
import { Module as ReceiverUsersList } from "./modules/receiver-users"
import { NotificationProps } from "./types"

type TriggerNotificationType = {
    notification: NotificationProps
}
export async function TriggerNotification({ notification }: TriggerNotificationType) {
    const { notificationData } = await NotificationData({ notification })
    const usersList = await ReceiverUsersList({ notification })
    const cleanedUsersList = usersList.filter((user) => user.token !== null)
    const message = {
        tokens: cleanedUsersList.map((user) => {
            return user.token
        }),
        notification: {
            imageUrl:
                "https://images.pexels.com/photos/27425265/pexels-photo-27425265/free-photo-of-por-do-sol-moda-tendencia-homem.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        },
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
        ADMIN.messaging()
            .sendMulticast(message)
            .then((response) => {
                console.log("Successfully sent message:", response)
            })
            .catch((error) => {
                console.log("Error sending message:", error)
            })
            .finally(async () => {
                await CreateNotificationOnDb({ notification })
            })
    }
}
