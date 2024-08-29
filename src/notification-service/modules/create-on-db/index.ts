import { ValidationError } from "../../../errors"
import Notification from "../../../models/user/notification-model.js"
import { NotificationProps } from "./../../types"

type ModuleProps = {
    notification: NotificationProps
}

export async function Module({ notification }: ModuleProps) {
    if (notification.type == "FOLLOW-USER" || notification.type == "VIEW-USER") {
        if (notification.data.senderUserId == notification.data.receiverUserId) {
            return new ValidationError({
                message: "a user cannot send notification to themselves",
            })
        } else {
            return await Notification.create({
                sender_user_id: notification.data.senderUserId,
                receiver_user_id: notification.data.receiverUserId,
                type: notification.type,
            })
        }
    } else if (notification.type == "LIKE-MOMENT") {
        if (notification.data.senderUserId == notification.data.receiverUserId) {
            return new ValidationError({
                message: "a user cannot send notification to themselves",
            })
        } else {
            return await Notification.create({
                sender_user_id: notification.data.senderUserId,
                receiver_user_id: notification.data.receiverUserId,
                moment_id: notification.data.momentId,
                type: notification.type,
            })
        }
    } else if (notification.type == "NEW-MEMORY") {
        return await Notification.create({
            sender_user_id: notification.data.senderUserId,
            memory_id: notification.data.memoryId,
            type: notification.type,
        })
    } else if (notification.type == "ADD-TO-MEMORY") {
        return await Notification.create({
            sender_user_id: notification.data.senderUserId,
            moment_id: notification.data.momentId,
            type: notification.type,
        })
    }
}
