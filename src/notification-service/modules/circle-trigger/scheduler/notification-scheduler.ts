import * as cron from "node-cron"
import { NotificationManager } from "../manager"
import { NotificationRule } from "../types"

export class NotificationScheduler {
    private tasks: Map<string, cron.ScheduledTask> = new Map()

    constructor(private readonly notificationManager: NotificationManager) {}

    public async scheduleRule(rule: NotificationRule): Promise<void> {
        await this.notificationManager.executeRule(rule.id)
    }

    public stopRule(ruleId: string): void {
        const task = this.tasks.get(ruleId)
        if (task) {
            task.stop()
            this.tasks.delete(ruleId)
        }
    }

    public stopAll(): void {
        for (const task of this.tasks.values()) {
            task.stop()
        }
        this.tasks.clear()
    }
}
