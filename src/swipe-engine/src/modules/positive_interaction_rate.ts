import sigmoid from "../math/sigmoid"
const positiveInteractionWeights = require('../data/positive_action_weights.json')
const negativeInteractionWeights = require("../data/negative_action_weights.json")

export async function positive_interaction_rate(processed_interactions : any) {
    const interactions_vector = processed_interactions.processed_interactions.map(i => {
        const interaction = i.interaction
        const interaction_with_weights = {
            like:interaction.like * positiveInteractionWeights.like.weight,
            share: interaction.share * positiveInteractionWeights.share.weight,
            click_into_moment: interaction.click_into_moment * positiveInteractionWeights.click_into_moment.weight,
            watch_time: interaction.watch_time * positiveInteractionWeights.watch_time.weight,
            click_profile: interaction.click_profile * positiveInteractionWeights.click_profile.weight,
            comment: interaction.comment * positiveInteractionWeights.comment.weight,
            like_comment: interaction.like_comment * positiveInteractionWeights.like_comment.weight,
            pass_to_next: interaction.pass_to_next * positiveInteractionWeights.pass_to_next.weight,
            show_less_often: interaction.show_less_often * positiveInteractionWeights.show_less_often.weight,
            report: interaction.report * positiveInteractionWeights.report.weight
        }
    
        let total: number[] = [];
        Object.keys(interaction_with_weights).forEach(action => {
            total.push(interaction_with_weights[action]);
        })
        
        return {
            moment_id: i.id,
            moment_owner_id: i.user_id,
            interaction_rate: Number(sigmoid(total.reduce((acc, cur) => acc + cur, 0)/10))
        }
    })
    return {
        user_id: processed_interactions.user_id,
        tags_vector: processed_interactions.tags_vector,
        interations_vector: interactions_vector,
        
    }
}

export function calcule_one_positive_interaction_rate(processed_interaction: any): number{
    const interaction_with_weights = {
        like:processed_interaction.like * positiveInteractionWeights.like.weight,
        share: processed_interaction.share * positiveInteractionWeights.share.weight,
        click_into_moment: processed_interaction.click_into_moment * positiveInteractionWeights.click_into_moment.weight,
        watch_time: processed_interaction.watch_time * positiveInteractionWeights.watch_time.weight,
        click_profile: processed_interaction.click_profile * positiveInteractionWeights.click_profile.weight,
        comment: processed_interaction.comment * positiveInteractionWeights.comment.weight,
        like_comment: processed_interaction.like_comment * positiveInteractionWeights.like_comment.weight,
        pass_to_next: processed_interaction.pass_to_next * positiveInteractionWeights.pass_to_next.weight,
        show_less_often: processed_interaction.show_less_often * positiveInteractionWeights.show_less_often.weight,
        report: processed_interaction.report * positiveInteractionWeights.report.weight
    }

    let total: number[] = [];
    Object.keys(interaction_with_weights).forEach(action => {
        total.push(interaction_with_weights[action]);
    })
    return Number(sigmoid(total.reduce((acc, cur) => acc + cur, 0)/10))
}

export function calcule_one_negative_interaction_rate(processed_interaction: any): number{
    const interaction_with_weights = {
        like:processed_interaction.like * negativeInteractionWeights.like.weight,
        share: processed_interaction.share * negativeInteractionWeights.share.weight,
        click_into_moment: processed_interaction.click_into_moment * negativeInteractionWeights.click_into_moment.weight,
        watch_time: processed_interaction.watch_time * negativeInteractionWeights.watch_time.weight,
        click_profile: processed_interaction.click_profile * negativeInteractionWeights.click_profile.weight,
        comment: processed_interaction.comment * negativeInteractionWeights.comment.weight,
        like_comment: processed_interaction.like_comment * negativeInteractionWeights.like_comment.weight,
        pass_to_next: processed_interaction.pass_to_next * negativeInteractionWeights.pass_to_next.weight,
        show_less_often: processed_interaction.show_less_often * negativeInteractionWeights.show_less_often.weight,
        report: processed_interaction.report * negativeInteractionWeights.report.weight
    }

    let total: number[] = [];
    Object.keys(interaction_with_weights).forEach(action => {
        total.push(interaction_with_weights[action]);
    })
    return Number(sigmoid(total.reduce((acc, cur) => acc + cur, 0)/10))
}