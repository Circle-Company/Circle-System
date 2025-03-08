import MomentModel from "@models/moments/moment-model"
import { Op } from "sequelize"

export async function getFeedCandidates(userId: number) {
    // Calcula o intervalo de tempo das últimas 24 horas
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 1) // Subtrai 1 dia (24 horas)

    // Buscar os momentos criados nas últimas 24 horas

    const recentPosts = await MomentModel.findAll({
        where: {
            created_at: {
                [Op.between]: [startDate, endDate],
            },
        } as any,
    })

    return recentPosts
}

export async function getCandidatesEmbeddings(candidates) {}
