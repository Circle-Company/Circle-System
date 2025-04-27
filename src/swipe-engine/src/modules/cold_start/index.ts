//@ts-nocheck
import Moment from "@models/moments/moment-model.js"
import MomentInteraction from "@models/moments/moment_interaction-model.js"
import { QueryTypes } from "sequelize"
import { connection as db } from "../../../../database/index.js"

export default async function cold_start_algorithm(): Promise<number[]> {
    try {
        const nowDate = new Date()
        const twentyFourHoursAgo = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000)
        let candidateMoments

        // Busca momentos das últimas 24 horas

        const moments = (await db.query(
            `SELECT id 
             FROM moments 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
             AND visible = true 
             AND blocked = false 
             ORDER BY created_at DESC
             LIMIT 100`,
            {
                type: QueryTypes.SELECT,
            }
        )) as { id: number }[]

        if (moments.length >= 10) {
            candidateMoments = moments
        } else {
            // Fallback: busca os 100 momentos mais recentes
            candidateMoments = await Moment.findAll({
                where: {
                    visible: true,
                    blocked: false,
                },
                order: [["created_at", "DESC"]],
                attributes: ["id"],
                limit: 100,
                raw: true,
            })
        }

        if (!candidateMoments || candidateMoments.length === 0) {
            return []
        }

        // Procura no banco todas as interações com os moments
        const candidateMomentsInteraction = await Promise.all(
            candidateMoments.map(async (moment) => {
                try {
                    const interactions = await MomentInteraction.findAll({
                        where: { moment_id: moment.id },
                        attributes: ["positive_interaction_rate"],
                        raw: true,
                    })
                    return { moment_id: moment.id, interactions }
                } catch (error) {
                    console.error(`Erro ao buscar interações para momento ${moment.id}:`, error)
                    return { moment_id: moment.id, interactions: [] }
                }
            })
        )

        // Calcula um score apartir dos positive_interaction_rate das interações
        const scoredMoments = candidateMomentsInteraction.map(({ moment_id, interactions }) => {
            const interactionCount = interactions.length
            const totalInteractionRate = interactions.reduce(
                (sum, interaction) => sum + (interaction.positive_interaction_rate || 0),
                0
            )
            const averageInteractionRate =
                interactionCount > 0 ? totalInteractionRate / interactionCount : 1
            return { moment_id, score: averageInteractionRate }
        })

        // Filtrar os momentos com escore médio maior que 0
        const nonZeroMoments = scoredMoments.filter((moment) => moment.score > 0)

        // Ordenar os momentos filtrados por escore médio em ordem decrescente
        nonZeroMoments.sort((a, b) => b.score - a.score)

        // Selecionar os 10 primeiros momentos com maior escore médio
        const top10Moments = nonZeroMoments.slice(0, 10)

        return top10Moments.map((moment) => Number(moment.moment_id))
    } catch (error) {
        console.error("Erro no cold start algorithm:", error)
        return [] // Retorna array vazio em caso de erro
    }
}
