export type CreateNotificationProps = {
    sender_user_id: bigint
    receiver_user_id: bigint
    type: NotificationType
    content_id: bigint | null
}

export type SendNotificationProps = {
    notification: {
        id: bigint
        sender_user_id: bigint
        receiver_user_id: bigint
        viewed: boolean
        type: NotificationType
        content_id: bigint
        midia?: {
            nhd_resolution: string
        }
        created_at: string
        updated_at: string
    }
}

export type AutoSendNotificationProps = {
    sender_user_id: bigint
    receiver_user_id: bigint
    type: NotificationType
    content_id: bigint | null
}

type NotificationType =
    | "LIKE-MOMENT"
    | "LIKE-MOMENT-2"
    | "LIKE-MOMENT-3"
    | "LIKE-MEMORY"
    | "LIKE-COMMENT"
    | "COMMENT-MOMENT"
    | "FOLLOW-USER"
    | "VIEW-USER"
