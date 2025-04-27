import Preference from "@models/preference/preference-model"
import User from "@models/user/user-model"
import { ADMIN } from "config/firebase"
import { messaging } from "firebase-admin"
import {
    NotificationMessage,
    NotificationResult,
    NotificationRule,
    NotificationStats,
    UserNotificationPreferences,
} from "./types"

export class NotificationManager {
    private rules: Map<string, NotificationRule> = new Map()
    private stats: Map<string, NotificationStats> = new Map()

    constructor(
        private readonly messaging: messaging.Messaging = ADMIN.messaging(),
        private readonly maxRetries: number = 3
    ) {}

    public registerRule(rule: NotificationRule): void {
        if (this.rules.has(rule.id)) {
            throw new Error(`Regra com ID ${rule.id} já está registrada`)
        }
        this.rules.set(rule.id, rule)
        this.stats.set(rule.id, {
            delivered: 0,
            failed: 0,
            opened: 0,
            totalSent: 0,
        })
    }

    public async executeRule(ruleId: string): Promise<NotificationResult[]> {
        const rule = this.rules.get(ruleId)
        if (!rule) {
            throw new Error(`Regra ${ruleId} não encontrada`)
        }

        const shouldExecute = await rule.condition()
        if (!shouldExecute) {
            return []
        }

        const targetUsers = await rule.getTargetUsers()
        const results: NotificationResult[] = []

        for (const userId of targetUsers) {
            try {
                const userPrefs = await this.getUserPreferences(userId)
                if (!this.shouldSendNotification(userPrefs, rule)) {
                    continue
                }

                const userData = await this.getUserData(userId)
                const message = rule.getMessage(userData)
                const result = await this.sendNotification(userId, message, rule.id)
                results.push(result)

                this.updateStats(rule.id, result.success)
            } catch (error) {
                results.push({
                    success: false,
                    error: error as Error,
                    userId,
                    ruleId,
                    timestamp: new Date(),
                })
            }
        }

        return results
    }

    private async sendNotification(
        token: string,
        message: NotificationMessage,
        ruleId: string,
        retryCount = 0
    ): Promise<NotificationResult> {
        try {
            console.log(`Tentando enviar notificação para token: ${token}`)

            const result = await this.messaging.send({
                token,
                notification: {
                    title: message.title,
                    body: message.body,
                    imageUrl: message.imageUrl,
                },
                data: message.data || {},
                android: {
                    priority: "high",
                    notification: {
                        sound: "default",
                        clickAction: "FLUTTER_NOTIFICATION_CLICK",
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: "default",
                            badge: 1,
                        },
                    },
                },
            })

            console.log(`Notificação enviada com sucesso. MessageID: ${result}`)
            return {
                success: true,
                messageId: result,
                userId: token,
                ruleId,
                timestamp: new Date(),
            }
        } catch (error) {
            console.error(`Erro ao enviar notificação para token ${token}:`, error)

            if (retryCount < this.maxRetries) {
                console.log(`Tentando reenviar (tentativa ${retryCount + 1}/${this.maxRetries})...`)
                await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
                return this.sendNotification(token, message, ruleId, retryCount + 1)
            }

            throw error
        }
    }

    private async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
        const preferences = await Preference.findOne({
            where: { user_id: BigInt(userId) },
        })

        let enabled = true
        let disabledCategories: string[] = []
        let timezone = "America/Sao_Paulo"

        if (preferences?.disable_news_push_notification) {
            enabled = false
            disabledCategories.push("news")
        }
        if (preferences?.disable_around_you_push_notification) {
            enabled = false
            disabledCategories.push("around_you")
        }
        if (preferences?.disable_sugestions_push_notification) {
            enabled = false
            disabledCategories.push("sugestions")
        }
        return {
            enabled,
            timezone,
            disabledCategories,
        }
    }

    private async getUserData(userId: string): Promise<Record<string, any>> {
        const user = await User.findOne({
            where: { id: userId },
            attributes: ["username"],
        })

        return user || {}
    }

    private shouldSendNotification(
        prefs: UserNotificationPreferences,
        rule: NotificationRule
    ): boolean {
        if (!prefs.enabled) return false
        if (prefs.disabledCategories?.includes(rule.id)) return false

        if (prefs.quietHoursStart && prefs.quietHoursEnd) {
            const now = new Date()
            const userTime = new Date(now.toLocaleString("en-US", { timeZone: prefs.timezone }))
            const hours = userTime.getHours()
            const minutes = userTime.getMinutes()
            const currentTime = `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}`

            if (currentTime >= prefs.quietHoursStart && currentTime <= prefs.quietHoursEnd) {
                return false
            }
        }

        return true
    }

    private updateStats(ruleId: string, success: boolean): void {
        const stats = this.stats.get(ruleId)
        if (!stats) return

        stats.totalSent++
        if (success) {
            stats.delivered++
        } else {
            stats.failed++
        }
    }

    public getStats(ruleId: string): NotificationStats | undefined {
        return this.stats.get(ruleId)
    }

    public getAllRules(): NotificationRule[] {
        return Array.from(this.rules.values())
    }
}
