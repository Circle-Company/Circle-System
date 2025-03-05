import { Op } from 'sequelize'
import MomentInteraction from '../../models/moments/moment_interaction-model.js'
import MomentTag from '../../models/moments/moment_tag-model.js'
import SecurityLayer from '../security_layer'
import { InteractionQueueProps } from '../types.js'

type tagWeight = {
    tag_id: number,
    weight: number
}

type InteractionTagsAlgorithmProps = {
    tags_with_weights: tagWeight[], 
    users_similarity: any,
    interaction_queue: InteractionQueueProps,
    interacted_moments_list: Array<number>
}

export default async function interaction_tags_algorithm({
    tags_with_weights,
    users_similarity,
    interaction_queue,
    interacted_moments_list
}: InteractionTagsAlgorithmProps): Promise<number | null> {

    //console.log({tags_with_weights, interaction_queue})
    console.log('tags_with_weights: ', tags_with_weights)

    let maxWeightTag: tagWeight | undefined
    let user_id: number = interaction_queue.user_id
    let highestScoreMoment: { moment_id: number, score: number } | undefined

    // Percorre o array de tags e retorna a tag com maior peso

    if(tags_with_weights.length > 0){
        tags_with_weights.forEach((tag) => {
            if (!maxWeightTag || tag.weight > maxWeightTag.weight)  maxWeightTag = tag
        })

        console.log('maxWeightTag?.tag_id: ', maxWeightTag?.tag_id)

        // Busca os moments que possuem a tag de maior peso
        const moments_with_tag = await MomentTag.findAll({
            where: {tag_id: maxWeightTag?.tag_id, moment_id: {[Op.notIn]: interacted_moments_list}},
            attributes: ['moment_id']
        })

        console.log('moments_with_tag: ', moments_with_tag)

        // Adiciona a camada de segurança que filtra moments bloqueados e deletados
        // moments_with_tag.map(moment => Number(moment.moment_id))
        const secure_moments = await SecurityLayer({
            momentsIdsList: moments_with_tag.map(moment => Number(moment.moment_id)),
            options: { allowInvisible: true, allowDeleted: true, allowBlocked: true }
        })


        // Verifica se sobrou algum moment depois da SecurityLayer
        if(!secure_moments) return null
        else {

            /** 
            const filtered_moments = await UserInteractionFilter({
                userId: user_id,
                momentsIdsList: secure_moments.map(moment => Number(moment.id)),
                options: {
                    allowBlocked: false,
                    allowFollowed: true,
                    allowRelated: true,
                    allowShared: false,
                    allowViewed: false,
                    allowReported: false,
                    allowLiked: false
                }
            })
              */   
            // Busca as interações com os moments que possuem a tag escolhida (de maior peso)
            const interaction_with_moments = await Promise.all( secure_moments.map(async (i) => {
                return await MomentInteraction.findAll({
                    where: {moment_id: i.id},
                    attributes: ['positive_interaction_rate', 'user_id']
                })
            }))

            // Agrupa as interações pelos moments
            const grouped_interactions = interaction_with_moments.map((interactions, index) => ({
                moment_id: secure_moments[index].id,
                interactions
            }))

            // Aplicar similaridade de usuários e calcular scores
            const moments_with_score = grouped_interactions.map((group) => {
                const interactions_scores = group.interactions.map((interaction) => {
                    const similarity = users_similarity[user_id][interaction.user_id] || 0
                    return interaction.positive_interaction_rate * similarity
                })
                
                const momentScore = interactions_scores.length > 0 ? interactions_scores.reduce((acc, curr) => acc + curr, 0) / interactions_scores.length : 0
                return { moment_id: group.moment_id, score: momentScore };
            })

            // Encontrar o moment com o maior score da lista
            moments_with_score.forEach((moment) => {
                if (!highestScoreMoment || moment.score > highestScoreMoment.score) highestScoreMoment = moment
            })

            console.log('highestScoreMoment: ', Number(highestScoreMoment?.moment_id))

            return Number(highestScoreMoment?.moment_id)
        }        
    } else return null

}