import { Op } from 'sequelize'
import Moment from '../../models/moments/moment-model.js'
import MomentInteraction from '../../models/moments/moment_interaction-model.js'

export default async function cold_start_algorithm(): Promise<number[]> {

    const nowDate = new Date()
    const twentyFourHoursAgo = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000)
    let candidateMoments

    const { count, rows: todayMoments } = await Moment.findAndCountAll({
        where: { created_at: {[Op.gte]: twentyFourHoursAgo} },
        attributes: ['id']
    })

    if(count >= 10) candidateMoments = todayMoments
    else candidateMoments = await Moment.findAll({
        order: [['created_at', 'DESC']],
        attributes: ['id'],
        limit: 100
    })

    // Procura no banco todas as interações com os moments
    const candidateMomentsInteraction = await Promise.all(candidateMoments.map(async (moment) => {
        const interactions = await MomentInteraction.findAll({
            where: { moment_id: moment.id},
            attributes: ['positive_interaction_rate']
        })
        return {moment_id: moment.id, interactions}
    }))

    // Calcula um score apartir dos positive_interaction_rate das interações
    const scoredMoments = candidateMomentsInteraction.map(({ moment_id, interactions }) => {
        // Calcular a média de positive_interaction_rate para o momento atual
        const interactionCount = interactions.length
        const totalInteractionRate = interactions.reduce((sum, interaction) => sum + interaction.positive_interaction_rate, 0)
        const averageInteractionRate = interactionCount > 0 ? totalInteractionRate / interactionCount : 1
        return { moment_id, score: averageInteractionRate }
    })

    // Filtrar os momentos com escore médio maior que 0
    const nonZeroMoments = scoredMoments.filter(moment => moment.score > 0)

    // Ordenar os momentos filtrados por escore médio em ordem decrescente
    nonZeroMoments.sort((a, b) => b.score - a.score)

    // Selecionar os 10 primeiros momentos com maior escore médio
    const top10Moments = nonZeroMoments.slice(0, 10)

    return top10Moments.map((moment) => { return moment.moment_id })
}