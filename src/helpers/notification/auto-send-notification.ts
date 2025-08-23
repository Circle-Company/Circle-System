import { InternalServerError } from "../../errors"
import { create_notification } from "./create-notification"
import { AutoSendNotificationProps } from "./types"

export async function auto_send_notification(props: AutoSendNotificationProps) {
    try {
        await create_notification({
            receiver_user_id: props.receiver_user_id,
            sender_user_id: props.sender_user_id,
            type: props.type,
            content_id: props.content_id ? props.content_id : null,
        })
        //await send_notification({notification: notification})
    } catch {
        return new InternalServerError({
            message: "We are unable to create and send notifications",
        })
    }
}
