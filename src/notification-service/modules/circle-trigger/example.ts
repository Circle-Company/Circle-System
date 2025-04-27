import { getMessaging } from "firebase-admin/messaging"
import { NotificationManager } from "./manager"
import { InactiveUsersRule } from "./rules/inactive-users-rule"
import { NotificationScheduler } from "./scheduler/notification-scheduler"

// Cria instância do gerenciador de notificações
const messaging = getMessaging()
const notificationManager = new NotificationManager(messaging)

// Cria instância do agendador
const scheduler = new NotificationScheduler(notificationManager)

// Registra regras
const inactiveUsersRule = new InactiveUsersRule()
notificationManager.registerRule(inactiveUsersRule)

// Agenda execução das regras
scheduler.scheduleRule(inactiveUsersRule)

// Exemplo de execução manual de uma regra
async function main() {
    try {
        console.log("Iniciando execução da regra de usuários inativos...")

        const results = await notificationManager.executeRule(inactiveUsersRule.id)
        console.log("Resultados do envio:", results)

        const stats = notificationManager.getStats(inactiveUsersRule.id)
        console.log("Estatísticas da regra:", stats)
    } catch (error) {
        console.error("Erro ao executar regra:", error)
    }
}

// Executa o exemplo
if (require.main === module) {
    main().catch(console.error)
}
