import { InternalServerError } from "@errors/index"
import MomentInteraction from "@models/moments/moment_interaction-model"
import { Request, Response } from "express"
import { Modules_Controller } from "./src/modules/modules-controller"
import {
    calcule_one_negative_interaction_rate,
    calcule_one_positive_interaction_rate,
} from "./src/modules/positive_interaction_rate"
import { normalizeWatchTime } from "./src/modules/pre-processing"
import { getPostEmbedding, updatePostEmbedding } from "./src/modules_v2/posts/actions"
import { getUserEmbedding, updateUserEmbedding } from "./src/modules_v2/users/embeddings"

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

export async function getMoments(data) {
    return await Modules_Controller(data)
}

export async function getFeed(req: Request, res: Response) {
    const userId = req.params.id
    const period = req.query.period
}

export async function storeInteraction(req: Request, res: Response) {
    const userId = Number(req.params.user_id)
    const postId = Number(req.params.post_id)
    const type: InteractionTypeProp = String(req.query.type)
    const currentUserEmbedding = await getUserEmbedding(userId)
    const currentPostEmbedding = await getPostEmbedding(postId)

    const updatedStatistics = req.body.statistics
    const duration = req.body.duration
    const updatedTags = req.body.tags

    if (type == "like") {
        await updatePostEmbedding({
            updatedStatistics,
            updatedTags,
            currentEmbedding: currentPostEmbedding,
            totalDuration: duration,
        })
        // @ts-ignore
        await updateUserEmbedding()
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
            watch_time: normalizeWatchTime(interaction.watch_time, 0) / 1000,
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
