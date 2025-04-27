import { ADMIN } from "config/firebase"
import { NotificationManager } from "./manager"
import { InactiveUsersRule } from "./rules/inactive-users-rule"
import { NotificationScheduler } from "./scheduler/notification-scheduler"

export class NotificationService {
    private manager: NotificationManager
    private scheduler: NotificationScheduler

    private constructor() {
        this.manager = new NotificationManager(ADMIN.messaging())
        this.scheduler = new NotificationScheduler(this.manager)
        this.initializeRules()
    }

    private initializeRules() {
        try {
            // Regra de usuários inativos
            const inactiveUsersRule = new InactiveUsersRule()
            this.manager.registerRule(inactiveUsersRule)
            this.scheduler.scheduleRule(inactiveUsersRule)

            console.log("✅ Regras de notificação inicializadas com sucesso")
        } catch (error) {
            console.error("❌ Erro ao inicializar regras de notificação:", error)
        }
    }

    public static initialize() {
        new NotificationService()
    }

    public getManager() {
        return this.manager
    }

    public getScheduler() {
        return this.scheduler
    }
}
