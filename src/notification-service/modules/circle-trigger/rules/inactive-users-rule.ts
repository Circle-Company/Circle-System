import { QueryTypes } from "sequelize"
import { connection as db } from "../../../../database/index.js"
import { NotificationMessage, NotificationRule, Schedule } from "../types"

export class InactiveUsersRule implements NotificationRule {
    public readonly id = "inactive-users"
    public readonly name = "Usuários Inativos"
    public readonly description = "Notifica usuários que não acessam o app há 7 dias"

    private readonly inactiveDays = 1

    async condition(): Promise<boolean> {
        try {
            const [result] = await db.query(
                `SELECT COUNT(*) as count FROM users 
                WHERE last_login_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
                {
                    replacements: [this.inactiveDays],
                    type: QueryTypes.SELECT,
                }
            )

            const count = (result as any).count
            console.log(`Encontrados ${count} usuários inativos`)
            return count > 0
        } catch (error) {
            console.error("Erro ao verificar condição:", error)
            return false
        }
    }

    async getTargetUsers(): Promise<string[]> {
        try {
            console.log("Buscando usuários inativos...")

            const users = await db.query(
                `SELECT id FROM users 
                WHERE last_login_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
                {
                    replacements: [this.inactiveDays],
                    type: QueryTypes.SELECT,
                }
            )

            if (!users || users.length === 0) {
                console.log("Nenhum usuário inativo encontrado")
                return []
            }

            console.log(`Encontrados ${users.length} usuários inativos`)
            const userIds = users.map((user: any) => user.id)

            // Busca tokens
            const tokens = await db.query(
                `SELECT token FROM notification_tokens 
                WHERE user_id IN (?)`,
                {
                    replacements: [userIds],
                    type: QueryTypes.SELECT,
                }
            )

            if (!tokens || tokens.length === 0) {
                console.log("Nenhum token encontrado para os usuários inativos")
                return []
            }

            console.log(`Encontrados ${tokens.length} tokens de notificação`)

            // Filtra tokens válidos
            const validTokens = tokens
                .map((t: any) => t.token)
                .filter((token) => token && typeof token === "string" && token.length > 0)

            console.log(`${validTokens.length} tokens válidos para envio`)
            return validTokens
        } catch (error) {
            console.error("Erro ao buscar tokens de usuários inativos:", error)
            return []
        }
    }

    getMessage(userData?: Record<string, any>): NotificationMessage {
        const username = userData?.username ? ` ${userData.username}` : ""

        return {
            title: `Olá${username}! 😊`,
            body: "Sentimos sua falta! Volte para ver as novidades que preparamos para você!",
            data: {
                type: "inactive_user",
                daysInactive: this.inactiveDays.toString(),
            },
        }
    }

    getSchedule(): Schedule {
        return {
            frequency: "daily",
            time: "12:00",
            timezone: "America/Sao_Paulo",
        }
    }
}
