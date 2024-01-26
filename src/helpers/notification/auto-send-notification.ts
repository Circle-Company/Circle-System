import { create_notification } from "./create-notification"
import { send_notification } from "./send-notification"
import { AutoSendNotificationProps } from "./types"
import { InternalServerError } from "../../errors"


export async function auto_send_notification(props: AutoSendNotificationProps) {
    try{
        const notification = await create_notification(props)
        await send_notification({notification: notification})        
    } catch{
        return new InternalServerError({
            message: 'We are unable to create and send notifications',
        })
    }

}