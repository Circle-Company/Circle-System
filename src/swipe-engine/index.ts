import {
    calcule_one_negative_interaction_rate,
    calcule_one_positive_interaction_rate,
} from "./src/modules/positive_interaction_rate"

import { InternalServerError } from "@errors/index"
import MomentInteraction from "@models/moments/moment_interaction-model"
import cold_start_algorithm from "./src/modules/cold_start/index"

export type InteractionTypeProp =
    | "like"
    | "share"
    | "clickIntoMoment"
    | "watchTime"
    | "clickProfile"
    | "comment"
    | "showLessOften"
    | "report"
    | string

export async function getMoments() {
    try {
        const momentIds = await cold_start_algorithm()
        if (!Array.isArray(momentIds)) {
            console.error("cold_start_algorithm retornou um formato inválido:", momentIds)
            return []
        }
        return momentIds.filter((id) => typeof id === "number" && !isNaN(id))
    } catch (error) {
        console.error("Erro ao buscar momentos:", error)
        throw new InternalServerError({
            message: "Erro ao buscar feed de momentos",
            action: "Por favor, tente novamente mais tarde",
        })
    }
}
export async function storeMomentInteraction(data) {
    const { user_id, moment_owner_id, moment_id, interaction } = data
    try {
        console.log(interaction)

        const processed_interaction = {
            like: interaction.like ? 1 : 0,
            share: interaction.share ? 1 : 0,
            click_into_moment: interaction.click_into_moment ? 1 : 0,
            watch_time: interaction.watch_time,
            click_profile: interaction.click_profile ? 1 : 0,
            comment: interaction.comment ? 1 : 0,
            like_comment: interaction.like_comment ? 1 : 0,
            pass_to_next: interaction.pass_to_next ? 1 : 0,
            show_less_often: interaction.show_less_often ? 1 : 0,
            report: interaction.report ? 1 : 0,
        }

        const negative_interaction_rate =
            calcule_one_negative_interaction_rate(processed_interaction)
        const positive_interaction_rate =
            calcule_one_positive_interaction_rate(processed_interaction)
        console.log(negative_interaction_rate, positive_interaction_rate)
        // @ts-ignore
        const stored_interaction = await MomentInteraction.create({
            user_id,
            moment_owner_id,
            moment_id,
            ...interaction,
            negative_interaction_rate,
            positive_interaction_rate,
            created_at: new Date(),
            updated_at: new Date(),
        })
        return stored_interaction
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}

export const SwipeEngine = {
    getMoments,
    storeMomentInteraction,
}
