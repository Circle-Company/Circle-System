import Handlebars from "handlebars"
import { NotificationMessage } from "../types"

const titleTemplate = Handlebars.compile("Olá{{#if username}} {{username}}{{/if}}! 😊")
const bodyTemplate = Handlebars.compile(
    "Sentimos sua falta! {{#if daysInactive}}Faz {{daysInactive}} dias que você não nos visita. {{/if}}Volte para ver as novidades que preparamos para você!"
)

export function createInactiveUserMessage(data: {
    username?: string
    daysInactive?: number
}): NotificationMessage {
    return {
        title: titleTemplate(data),
        body: bodyTemplate(data),
        data: {
            type: "inactive_user",
            daysInactive: data.daysInactive?.toString() || "7",
        },
    }
}
