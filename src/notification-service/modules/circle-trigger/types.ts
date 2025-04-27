import { NotificationType } from "notification-service/types"

export interface NotificationMessage {
    title: string
    body: string
    data?: Record<string, string>
    imageUrl?: string
}

export type ScheduleFrequency = "once" | "daily" | "weekly" | "monthly"
export type DayOfWeek =
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"

export interface Schedule {
    frequency: ScheduleFrequency
    dayOfWeek?: DayOfWeek
    time: string // formato HH:mm
    timezone?: string
}

export interface NotificationRule {
    id: string
    name: string
    description: string
    condition: () => Promise<boolean>
    getTargetUsers: () => Promise<string[]>
    getMessage: (userData?: Record<string, any>) => NotificationMessage
    getSchedule: () => Schedule
}

export interface NotificationResult {
    success: boolean
    messageId?: string
    error?: Error
    userId: string
    ruleId: string
    timestamp: Date
}

export interface NotificationStats {
    delivered: number
    failed: number
    opened: number
    totalSent: number
}

export interface UserNotificationPreferences {
    enabled: boolean
    quietHoursStart?: string // HH:mm
    quietHoursEnd?: string // HH:mm
    timezone: string
    disabledCategories?: string[]
}

export interface CircleNotification {
    type: NotificationType
    data: {
        senderUserId: bigint
        receiverUserId?: bigint
        momentId?: bigint
        memoryId?: bigint
    }
}
