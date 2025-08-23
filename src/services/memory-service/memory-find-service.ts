import { InternalServerError } from "../../errors"
import { populateMoment } from "../../helpers/populate-moments"
import Memory from "../../models/memories/memory-model"
import MemoryMoment from "../../models/memories/memory_moments-model"
import Like from "../../models/moments/like-model"
import Moment from "../../models/moments/moment-model"
import MomentMidia from "../../models/moments/moment_midia-model.js"
import MomentStatistic from "../../models/moments/moment_statistic-model.js"
import UserStatistic from "../../models/user/statistic-model"
import { FindMemoryMomentsProps, FindMemoryProps, FindUserMemoriesProps } from "./types"

export async function find_memory_moments({
    memory_id,
    page,
    pageSize,
    user_id,
}: FindMemoryMomentsProps) {
    try {
        const offset = (page - 1) * pageSize
        const { count, rows: memory_moments } = await MemoryMoment.findAndCountAll({
            where: { memory_id: memory_id.toString() },
            attributes: ["created_at", "moment_id"],
            include: [
                {
                    model: Moment,
                    as: "moment", // Especifique o alias aqui de acordo com o relacionamento em Memory
                    attributes: { exclude: ["user_id", "updated_at"] },
                    include: [
                        {
                            model: MomentMidia,
                            as: "moment_midias", // Especifique o alias aqui de acordo com o relacionamento em Memory
                            attributes: ["content_type", "nhd_resolution", "fullhd_resolution"],
                        },
                        {
                            model: MomentStatistic,
                            as: "moment_statistics", // Especifique o alias aqui de acordo com o relacionamento em Memory
                            attributes: ["total_likes_num"],
                        },
                    ],
                },
            ],
            offset: offset,
            limit: pageSize,
            order: [["created_at", "DESC"]],
        })

        const mapped = await Promise.all(
            memory_moments.map(async (item: any) => {
                const liked = await Like.findOne({
                    where: { user_id, liked_moment_id: item.moment.id },
                })

                return {
                    id: item.moment.id,
                    description: item.moment.description,
                    visible: item.moment.visible,
                    deleted: item.moment.deleted,
                    blocked: item.moment.blocked,
                    created_at: item.moment.createdAt,
                    updated_at: item.moment.updatedAt,
                    is_liked: Boolean(liked),
                    midia: {
                        content_type: item.moment.moment_midias.content_type,
                        nhd_resolution: item.moment.moment_midias.nhd_resolution,
                        fullhd_resolution: item.moment.moment_midias.fullhd_resolution,
                    },
                    statistics: {
                        total_likes_num: item.moment.moment_statistics.total_likes_num,
                    },
                }
            })
        )

        const filteredMoments = mapped.filter((moment) => {
            return moment.deleted === false && moment.visible === true && moment.blocked === false
        })
        filteredMoments.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const totalPages = Math.ceil(count / pageSize)
        return {
            data: filteredMoments,
            count,
            totalPages,
            currentPage: page,
            pageSize,
        }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}

export async function find_memory_moments_id({ memory_id }: FindMemoryProps) {
    try {
        const memory_moments = await MemoryMoment.findAll({
            where: { memory_id: memory_id.toString() },
            attributes: ["moment_id"],
        })

        return memory_moments.map((item) => {
            return item.moment_id
        })
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}

export async function find_memory({ memory_id }: FindMemoryProps) {
    try {
        const memory = await Memory.findOne({
            where: { id: memory_id },
            attributes: ["id", "title"],
        })

        if (!memory) throw new InternalServerError({ message: "Can't possible find this memory." })

        return {
            id: memory.id,
            title: memory.title,
        }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}

export async function find_user_memories({ user_id, page, pageSize }: FindUserMemoriesProps) {
    try {
        const offset = (page - 1) * pageSize
        const { count, rows: memories } = await Memory.findAndCountAll({
            where: { user_id },
            order: [["updated_at", "DESC"]],
            limit: pageSize,
            offset,
        })
        const totalPages = Math.ceil(count / pageSize)
        const userStatistic = await UserStatistic.findOne({
            where: { user_id: user_id.toString() },
            attributes: ["total_memories_num"],
        }).catch((err) => {
            throw new InternalServerError({ message: err })
        })

        const transformedOutput = await Promise.all(
            memories.map(async (memory) => {
                const memoryMoments = await MemoryMoment.findAll({
                    where: { memory_id: memory.id },
                    attributes: ["memory_id", "moment_id"],
                })

                const moments = await Promise.all(
                    memoryMoments.map(async (memory_moment) => {
                        console.log({ memory_moment })
                        return await populateMoment({
                            moment_id: memory_moment.moment_id,
                            statistic: true,
                        })
                    })
                )

                moments.sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                const filteredMoments = moments.filter((moment) => {
                    return (
                        moment.deleted === false &&
                        moment.visible === true &&
                        moment.blocked === false
                    )
                })
                const slicedMoment = filteredMoments.slice(0, 3)

                if (slicedMoment.length !== 0) {
                    return {
                        id: memory.id,
                        title: memory.title,
                        updated_at:
                            slicedMoment.length > 0
                                ? slicedMoment[0].created_at
                                : memory.updated_at,
                        moments: slicedMoment,
                        total_moments_num: moments.length,
                    }
                }
                return null // Retornar null se a memória não tiver momentos válidos
            })
        )

        // Filtra memórias que não são nulas
        const filteredOutput = transformedOutput.filter((memory) => memory !== null)

        // Ordena memórias filtradas
        filteredOutput.sort(
            (a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )

        return {
            memories: filteredOutput,
            count: userStatistic?.total_memories_num,
            totalPages,
            currentPage: page,
            pageSize,
        }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
