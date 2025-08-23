export type NotificationProps =
    | { type: "LIKE-MOMENT"; data: NotificationMoment }
    | { type: "NEW-MEMORY"; data: NotificationMemory }
    | { type: "ADD-TO-MEMORY"; data: NotificationAddMemory }
    | { type: "FOLLOW-USER"; data: NotificationUser }
    | { type: "VIEW-USER"; data: NotificationUser }

export type NotificationType =
    | "LIKE-MOMENT"
    | "NEW-MEMORY"
    | "ADD-TO-MEMORY"
    | "FOLLOW-USER"
    | "VIEW-USER"

type NotificationUser = {
    senderUserId: bigint
    receiverUserId: bigint
}

type NotificationMoment = {
    senderUserId: bigint
    receiverUserId: bigint
    momentId: bigint
}

type NotificationMemory = {
    senderUserId: bigint
    memoryId: bigint
}

type NotificationAddMemory = {
    senderUserId: bigint
    momentId: bigint
}
