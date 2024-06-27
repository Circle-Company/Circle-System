export type CreateNotificationProps = {
    sender_user_id: number,
    receiver_user_id: number,
    type: NotificationType
    content_id: number | null
}

export type SendNotificationProps = {
    notification: {
        id: number
        sender_user_id: number,
        receiver_user_id: number,
        viewed: boolean
        type: NotificationType,
        content_id: number
        midia?: {
            nhd_resolution: string
        }
        created_at: string,
        updated_at: string
    }
}

export type AutoSendNotificationProps = {
    sender_user_id: number,
    receiver_user_id: number,
    type: NotificationType,
    content_id: number | null
}

type NotificationType =
    'LIKE-MOMENT'
    | 'LIKE-MOMENT-2'
    | 'LIKE-MOMENT-3'
    | 'LIKE-MEMORY'
    | 'LIKE-COMMENT'
    | 'COMMENT-MOMENT'    
    | 'FOLLOW-USER'
    | 'VIEW-USER'
