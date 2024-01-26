export type CreateNotificationProps = {
    id: number
    sender_user_id: number,
    receiver_user_id: number,
    viewed: boolean
    type: NotificationType
    created_at: string
    updated_at: string
}

export type SendNotificationProps = {
    notification: {
        id: number
        sender_user_id: number,
        receiver_user_id: number,
        viewed: boolean
        type: NotificationType,
        created_at: string,
        updated_at: string
    }
}

export type AutoSendNotificationProps = {
    id: number
    sender_user_id: number,
    receiver_user_id: number,
    viewed: boolean
    type: NotificationType,
    created_at: string,
    updated_at: string
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
