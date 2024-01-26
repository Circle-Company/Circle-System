import { ValidationError } from "../../errors"
import { CreateNotificationProps } from "./types"
const Notification = require('../../models/user/notification-model.js')

export async function create_notification({
    sender_user_id, receiver_user_id, type
}: CreateNotificationProps) {
    if(sender_user_id == receiver_user_id) {
        return new ValidationError({
            message: 'a user cannot send notification to themselves',
        })
    } else {
        const notification = await Notification.create({ sender_user_id, receiver_user_id, type })     
        return notification
    }
}