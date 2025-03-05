//@ts-nocheck

import MomentInteraction from "@/models/moments/moment_interaction-model.js"
import MomentClick from "@/models/moments/profile_click-model.js"
import MomentShare from "@/models/moments/share-model.js"
import MomentSkip from "@/models/moments/skip-model.js"
import MomentView from "@/models/moments/view-model.js"

import MomentStatistic from "@/models/moments/moment_statistic-model.js"
import UserStatistic from "@/models/user/statistic-model.js"

import { AleatoryMomentFinder } from "./aleatory_moment_finder"
import calculate_similarities from "./calculate_similarities"
import cold_start_algorithm from "./cold_start"
import { InteractedMomentsIdsList } from "./interacted_moments_ids_list"
import interaction_tags_algorithm from "./interaction_tags_algorithm"
import negative_content_algorithm from "./negative_content_algorithm"
import {
    calcule_one_negative_interaction_rate,
    calcule_one_positive_interaction_rate,
    positive_interaction_rate,
} from "./positive_interaction_rate"
import { normalizeWatchTime, pre_processing } from "./pre-processing"
import { calculeTagsWeight } from "./tags_weight"
import { InteractionQueueProps } from "./types"

type ModuleControllerProps = {
    interaction_queue: InteractionQueueProps
}
export async function Modules_Controller({ interaction_queue }: ModuleControllerProps) {
    let coldStartMode: boolean
    let userHasInteractions: boolean
    if (interaction_queue.data) {
        if (interaction_queue.data.length > 0) {
            await Promise.all(
                interaction_queue.data.map(async (item: any) => {
                    const interaction: any = item.interaction
                    const processed_interaction = {
                        like: Number(interaction.liked),
                        share: Number(interaction.shared),
                        click_into_moment: Number(interaction.clickIntoMoment),
                        watch_time: normalizeWatchTime(interaction.watchTime, 0) / 1000,
                        click_profile: Number(interaction.clickProfile),
                        comment: Number(interaction.commented),
                        like_comment: Number(interaction.likeComment),
                        pass_to_next: Number(interaction.skipped),
                        show_less_often: Number(interaction.showLessOften),
                        report: Number(interaction.reported),
                    }

                    //@ts-ignore
                    await MomentInteraction.create({
                        user_id: interaction_queue.user_id,
                        moment_owner_id: item.userId,
                        moment_id: item.id,
                        like: interaction.liked,
                        share: interaction.shared,
                        click_into_moment: interaction.clickIntoMoment,
                        watch_time: normalizeWatchTime(interaction.watchTime, 0) / 1000,
                        click_profile: interaction.clickProfile,
                        comment: interaction.commented,
                        like_comment: interaction.likeComment,
                        pass_to_next: interaction.skipped,
                        show_less_often: interaction.showLessOften,
                        report: interaction.reported,
                        negative_interaction_rate:
                            calcule_one_negative_interaction_rate(processed_interaction),
                        positive_interaction_rate:
                            calcule_one_positive_interaction_rate(processed_interaction),
                        created_at: new Date(),
                        updated_at: new Date(),
                    })

                    if (interaction.shared) {
                        await Promise.all([
                            MomentStatistic.increment("total_shares_num", {
                                by: 1,
                                where: { moment_id: item.id },
                            }),
                            MomentShare.create({
                                user_id: interaction_queue.user_id,
                                shared_moment_id: item.id,
                            }),
                        ])
                    }
                    if (interaction.clickProfile) {
                        await Promise.all([
                            UserStatistic.increment("total_profile_views_num", {
                                by: 1,
                                where: { user_id: item.userId },
                            }),
                            MomentStatistic.increment("total_profile_clicks_num", {
                                by: 1,
                                where: { moment_id: item.id },
                            }),
                            MomentClick.create({
                                user_id: interaction_queue.user_id,
                                profile_clicked_moment_id: item.id,
                            }),
                        ])
                    }
                    if (interaction.skipped)
                        await MomentSkip.create({
                            user_id: interaction_queue.user_id,
                            skipped_moment_id: item.id,
                        })
                    else {
                        await Promise.all([
                            UserStatistic.increment("total_views_num", {
                                by: 1,
                                where: { user_id: item.userId },
                            }),
                            MomentStatistic.increment("total_views_num", {
                                by: 1,
                                where: { moment_id: item.id },
                            }),
                            MomentView.create({
                                user_id: interaction_queue.user_id,
                                viewed_moment_id: item.id,
                            }),
                        ])
                    }
                })
            )

            coldStartMode = false
            userHasInteractions = true
        } else {
            const userInteractions = await MomentInteraction.findOne({
                where: { user_id: interaction_queue.user_id },
            })
            if (userInteractions) {
                userHasInteractions = true
                coldStartMode = false
            } else {
                userHasInteractions = false
                coldStartMode = true
            }
        }
    } else {
        ;(coldStartMode = true), (userHasInteractions = false)
    }

    if (coldStartMode) return await cold_start_algorithm()
    else {
        const interacted_moments_list = await InteractedMomentsIdsList({
            user_id: interaction_queue.user_id,
        })
        const calculated_similarities = await calculate_similarities()
        const processed_interactions = await pre_processing(interaction_queue)
        const aditional_features = await positive_interaction_rate(processed_interactions)
        const tags_with_weights = await calculeTagsWeight(
            processed_interactions,
            aditional_features
        )

        const posts_from_tags = await interaction_tags_algorithm({
            tags_with_weights,
            users_similarity: calculated_similarities.users_similarity,
            interaction_queue,
            interacted_moments_list,
        })
        const negative_post = await negative_content_algorithm({
            users_similarity: calculated_similarities.users_similarity,
            interaction_queue,
            interacted_moments_list,
        })

        const returnMomentsList = [posts_from_tags, negative_post].filter((item) => item !== null)

        if (returnMomentsList.length == 0)
            return await AleatoryMomentFinder({
                quantity: 10,
                interacted_moments_list,
            })
    }
}
