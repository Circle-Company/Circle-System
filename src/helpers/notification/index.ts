import { CreateNotificationProps } from './types';
import { create_notification } from "./create-notification"
import { send_notification } from "./send-notification"
import { auto_send_notification } from "./auto-send-notification"

export const Notification = {
    Create: create_notification,
    Send: send_notification,
    AutoSend: auto_send_notification
}