// @ts-nocheck
import { SwipeEngine } from "@swipe-engine/index"
import { Op } from "sequelize"
import { InternalServerError, UnauthorizedError, ValidationError } from "../../errors"
import { populateMoment } from "../../helpers/populate-moments"
import Comment from "../../models/comments/comment-model.js"
import CommentLike from "../../models/comments/comment_likes-model.js"
import CommentStatistic from "../../models/comments/comment_statistics-model.js"
import MemoryMoment from "../../models/memories/memory_moments-model"
import Like from "../../models/moments/like-model"
import Moment from "../../models/moments/moment-model"
import Statistic from "../../models/moments/moment_statistic-model.js"
import MomentTags from "../../models/moments/moment_tag-model.js"
import Tag from "../../models/tags/tag-model"
import Follow from "../../models/user/follow-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import User from "../../models/user/user-model"
import {
    FindMomentStatisticsViewProps,
    FindMomentTagsProps,
    FindUserFeedMomentsProps,
    FindUserMomentsProps,
    FindUserMomentsTinyExcludeMemoryProps,
    MomentProps,
} from "./types"

export async function find_user_feed_moments({
    interaction_queue,
    user_id,
}: FindUserFeedMomentsProps) {
    try {
        // Verificações iniciais de parâmetros
        if (!user_id) {
            throw new ValidationError({
                message: "ID do usuário não fornecido",
                action: "Forneça um ID de usuário válido",
            })
        }

        const response = await SwipeEngine.getMoments()

        // Processando cada momento recomendado
        return await Promise.all(
            response.map(async (moment_id, index) => {
                try {
                    // Popula informações do momento
                    const moment_with_midia: MomentProps = await populateMoment({
                        moment_id,
                        statistic: true,
                        stats: false,
                        metadata: false,
                        midia: true,
                    }).catch((err: any) => {
                        throw new InternalServerError({
                            message: `Falha ao carregar dados do momento ${moment_id}: ${err.message}`,
                            action: "Tente novamente mais tarde",
                        })
                    })

                    // Busca informações adicionais sobre o proprietário do momento
                    const moment_user_id = await Moment.findOne({
                        where: { id: moment_with_midia.id },
                        attributes: ["user_id"],
                    }).catch((err: any) => {
                        throw new InternalServerError({
                            message: `Falha ao identificar proprietário do momento ${moment_id}: ${err.message}`,
                            action: "Verifique se o momento existe ou tente novamente mais tarde",
                        })
                    })

                    if (!moment_user_id) {
                        throw new InternalServerError({
                            message: `Proprietário do momento ${moment_id} não encontrado`,
                            action: "O momento pode ter sido excluído recentemente",
                        })
                    }

                    // Verifica se o usuário atual segue o proprietário do momento
                    const moment_user_followed = await Follow.findOne({
                        where: {
                            user_id,
                            followed_user_id: moment_user_id.user_id,
                        },
                    })

                    // Verifica se o usuário atual curtiu o momento
                    const moment_liked = await Like.findOne({
                        where: {
                            user_id,
                            liked_moment_id: moment_id,
                        },
                    })

                    // Busca informações do usuário proprietário do momento
                    // @ts-ignore: Problema com o tipo User e profile_pictures
                    const moment_user = await User.findOne({
                        where: { id: moment_user_id.user_id },
                        attributes: ["id", "username", "verifyed"],
                        include: [
                            {
                                model: ProfilePicture,
                                as: "profile_pictures",
                                attributes: ["fullhd_resolution", "tiny_resolution"],
                            },
                        ],
                    }).catch((err: any) => {
                        throw new InternalServerError({
                            message: `Falha ao carregar dados do proprietário do momento: ${err.message}`,
                            action: "Tente novamente mais tarde",
                        })
                    })

                    if (!moment_user) {
                        throw new InternalServerError({
                            message: "Dados do proprietário do momento não encontrados",
                            action: "O usuário proprietário pode ter sido excluído recentemente",
                        })
                    }

                    // Busca comentários do momento
                    try {
                        // @ts-ignore
                        const { count, rows: comments } = await Comment.findAndCountAll({
                            where: { moment_id: moment_with_midia.id },
                            attributes: ["id", "content", "created_at", "user_id"],
                        })

                        // Processa os comentários para incluir informações de curtidas
                        const comments_with_likes = await Promise.all(
                            comments.map(async (comment: any) => {
                                try {
                                    // @ts-ignore
                                    const statistic = await CommentStatistic.findOne({
                                        where: { comment_id: comment.id },
                                        attributes: ["total_likes_num"],
                                    })
                                    return {
                                        ...comment.dataValues,
                                        statistics: statistic,
                                    }
                                } catch (err: any) {
                                    // Retorna o comentário sem estatísticas em caso de erro
                                    return {
                                        ...comment.dataValues,
                                        statistics: { total_likes_num: 0 },
                                    }
                                }
                            })
                        )

                        // Ordena os comentários pelo número de curtidas e pega os 2 melhores
                        const sortedComments = comments_with_likes
                            .sort(
                                (a, b) =>
                                    (b.statistics?.total_likes_num || 0) -
                                    (a.statistics?.total_likes_num || 0)
                            )
                            .slice(0, 2)

                        // Adiciona informações de usuário aos comentários selecionados
                        const returnsComments = await Promise.all(
                            sortedComments.map(async (comment: any) => {
                                try {
                                    const user = await User.findOne({
                                        where: { id: comment.user_id },
                                        attributes: ["id", "username", "verifyed"],
                                        include: [
                                            {
                                                model: ProfilePicture,
                                                as: "profile_pictures",
                                                attributes: [
                                                    "fullhd_resolution",
                                                    "tiny_resolution",
                                                ],
                                            },
                                        ],
                                    })

                                    if (!user) {
                                        console.error(
                                            `[find_user_feed_moments] Usuário do comentário ${comment.id} não encontrado`
                                        )
                                        // Retorna o comentário sem informações de usuário em caso de erro
                                        return {
                                            ...comment,
                                            user: {
                                                id: null,
                                                username: "Usuário não encontrado",
                                                verifyed: false,
                                                profile_picture: {
                                                    small_resolution: null,
                                                    tiny_resolution: null,
                                                },
                                            },
                                        }
                                    }

                                    delete comment["user_id"]

                                    return {
                                        ...comment,
                                        user: {
                                            id: user.id,
                                            username: user.username,
                                            verifyed: user.verifyed,
                                            profile_picture: {
                                                small_resolution:
                                                    user.profile_pictures?.fullhd_resolution,
                                                tiny_resolution:
                                                    user.profile_pictures?.tiny_resolution,
                                            },
                                        },
                                    }
                                } catch (err: any) {
                                    console.error(
                                        `[find_user_feed_moments] Erro ao processar usuário para comentário ${comment.id}: ${err.message}`
                                    )
                                    // Retorna o comentário sem informações de usuário em caso de erro
                                    return {
                                        ...comment,
                                        user: {
                                            id: null,
                                            username: "Usuário não disponível",
                                            verifyed: false,
                                            profile_picture: {
                                                small_resolution: null,
                                                tiny_resolution: null,
                                            },
                                        },
                                    }
                                }
                            })
                        )

                        // Monta e retorna o objeto final do momento com todas as informações
                        return {
                            ...moment_with_midia,
                            user: {
                                id: moment_user.id,
                                username: moment_user.username,
                                verifyed: moment_user.verifyed,
                                profile_picture: {
                                    small_resolution:
                                        moment_user.profile_pictures?.fullhd_resolution,
                                    tiny_resolution: moment_user.profile_pictures?.tiny_resolution,
                                },
                                you_follow: Boolean(moment_user_followed),
                            },
                            comments: {
                                count,
                                comments: returnsComments,
                            },
                            is_liked: Boolean(moment_liked),
                        }
                    } catch (err: any) {
                        console.error(
                            `[find_user_feed_moments] Erro ao processar comentários para momento ${moment_id}: ${err.message}`
                        )
                        // Em caso de erro nos comentários, retorna o momento sem comentários
                        return {
                            ...moment_with_midia,
                            user: {
                                id: moment_user.id,
                                username: moment_user.username,
                                verifyed: moment_user.verifyed,
                                profile_picture: {
                                    small_resolution:
                                        moment_user.profile_pictures?.fullhd_resolution,
                                    tiny_resolution: moment_user.profile_pictures?.tiny_resolution,
                                },
                                you_follow: Boolean(moment_user_followed),
                            },
                            comments: {
                                count: 0,
                                comments: [],
                            },
                            is_liked: Boolean(moment_liked),
                        }
                    }
                } catch (err: any) {
                    console.error(
                        `[find_user_feed_moments] Erro ao processar momento ${moment_id}: ${err.message}`
                    )
                    // Se houver erro no processamento de um momento específico, pulamos ele e continuamos
                    return null
                }
            })
        ).then((results) => {
            // Filtra resultados null (momentos que falharam no processamento)
            const validResults = results.filter((moment) => moment !== null)
            console.log(
                `[find_user_feed_moments] Processo concluído para usuário ${user_id}. Retornando ${validResults.length} de ${response.length} momentos.`
            )
            return validResults
        })
    } catch (err: any) {
        console.error(`[find_user_feed_moments] Erro crítico: ${err.message}`, err.stack)

        // Tratamento diferenciado de acordo com o tipo de erro
        if (
            err.name === "SequelizeConnectionError" ||
            err.name === "SequelizeConnectionRefusedError"
        ) {
            throw new InternalServerError({
                message: "Não foi possível conectar ao banco de dados",
                action: "Verifique a conexão com o banco de dados ou tente novamente mais tarde",
            })
        } else if (err.name === "SequelizeTimeoutError") {
            throw new InternalServerError({
                message: "Timeout ao acessar o banco de dados",
                action: "O servidor está sobrecarregado, tente novamente mais tarde",
            })
        } else if (err.name === "ValidationError") {
            throw err // Repassa erros de validação
        } else {
            throw new InternalServerError({
                message: `Erro ao buscar feed de momentos: ${err.message}`,
                action: "Tente novamente mais tarde",
            })
        }
    }
}

export async function find_user_moments({
    user_id,
    page,
    pageSize,
    finded_user_pk,
}: FindUserMomentsProps) {
    try {
        const offset = (page - 1) * pageSize
        const { count, rows: moments } = await Moment.findAndCountAll({
            where: { user_id: finded_user_pk, visible: true, blocked: false },
            attributes: ["id", "description"],
            order: [["created_at", "DESC"]],
            limit: pageSize,
            offset,
        })

        const totalPages = Math.ceil(count / pageSize)

        const populated_moments = await Promise.all(
            moments.map(async (moment) => {
                const momentData = await populateMoment({
                    moment_id: moment.id,
                    tags: true,
                    statistic: true,
                    metadata: true,
                })

                const liked = await Like.findOne({
                    where: { user_id, liked_moment_id: moment.id },
                })

                return {
                    ...momentData,
                    is_liked: Boolean(liked),
                }
            })
        )

        const filteredMoments = populated_moments.filter((moment) => {
            return moment.deleted === false && moment.visible === true && moment.blocked === false
        })

        return {
            moments: filteredMoments,
            totalPages,
            currentPage: page,
            pageSize,
        }
    } catch (error: any) {
        // Lidar com erros de forma apropriada (por exemplo, lançar, logar ou retornar um erro padronizado)
        throw new Error("Erro ao buscar momentos do usuário: " + error.message)
    }
}

export async function find_user_moments_tiny({
    user_id,
    finded_user_pk,
    page,
    pageSize,
}: FindUserMomentsProps) {
    try {
        const offset = (page - 1) * pageSize
        const { count, rows: moments } = await Moment.findAndCountAll({
            where: { user_id: finded_user_pk, visible: true, blocked: false },
            attributes: ["id"],
            order: [["created_at", "DESC"]],
            limit: pageSize,
            offset,
        })

        const totalPages = Math.ceil(count / pageSize)

        const populated_moments = await Promise.all(
            moments.map(async (moment) => {
                const populated_moment: MomentProps = await populateMoment({
                    moment_id: moment.id,
                    midia: true,
                })

                const liked = await Like.findOne({
                    where: { user_id, liked_moment_id: moment.id },
                })

                return {
                    id: populated_moment.id,
                    midia: {
                        content_type: populated_moment.midia.content_type,
                        nhd_resolution: populated_moment.midia.nhd_resolution,
                    },
                    visible: populated_moment.visible,
                    deleted: populated_moment.deleted,
                    blocked: populated_moment.blocked,
                    is_liked: Boolean(liked),
                }
            })
        )

        const filteredMoments = populated_moments.filter((moment) => {
            return moment.deleted === false && moment.visible === true && moment.blocked === false
        })

        const cleanedMoments = filteredMoments.map((moment) => {
            return {
                id: moment.id,
                midia: moment.midia,
                is_liked: moment.is_liked,
            }
        })

        return {
            moments: cleanedMoments,
            totalPages,
            currentPage: page,
            pageSize,
        }
    } catch (error: any) {
        // Lidar com erros de forma apropriada (por exemplo, lançar, logar ou retornar um erro padronizado)
        throw new Error("Erro ao buscar momentos do usuário: " + error.message)
    }
}

export async function find_user_moments_tiny_exclude_memory({
    user_id,
    memory_id,
}: FindUserMomentsTinyExcludeMemoryProps) {
    try {
        const memory_moments = await MemoryMoment.findAll({
            where: { memory_id: memory_id.toString() },
        })
        console.log(memory_moments)
        const memoryMomentsIds = memory_moments.map((i: any) => i.moment_id.toString())

        const moments = await Moment.findAll({
            where: {
                user_id,
                visible: true,
                blocked: false,
                id: {
                    [Op.notIn]: memoryMomentsIds,
                },
            },
            attributes: ["id"],
            order: [["created_at", "DESC"]],
        })

        const populated_moments = await Promise.all(
            moments.map(async (moment) => {
                const populated_moment: MomentProps = await populateMoment({
                    moment_id: moment.id,
                    midia: true,
                })

                return {
                    id: populated_moment.id,
                    midia: {
                        content_type: populated_moment.midia.content_type,
                        nhd_resolution: populated_moment.midia.nhd_resolution,
                    },
                    visible: populated_moment.visible,
                    deleted: populated_moment.deleted,
                    blocked: populated_moment.blocked,
                }
            })
        )

        const filteredMoments = populated_moments.filter((moment) => {
            return moment.deleted === false && moment.visible === true && moment.blocked === false
        })

        const cleanedMoments = filteredMoments.map((moment) => {
            return {
                id: moment.id,
                midia: moment.midia,
            }
        })

        return cleanedMoments
    } catch (error: any) {
        // Lidar com erros de forma apropriada (por exemplo, lançar, logar ou retornar um erro padronizado)
        throw new Error("Erro ao buscar momentos do usuário: " + error.message)
    }
}

export async function find_moment_comments({ moment_id, user_id, page, pageSize }) {
    const offset = (page - 1) * pageSize

    // @ts-ignore
    const { count, rows: comments } = await Comment.findAndCountAll({
        where: { moment_id },
        attributes: ["id", "content", "createdAt"],
        order: [["createdAt", "DESC"]], // Corrigido o nome do campo para "createdAt"
        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "username", "verifyed"],
                include: [
                    {
                        model: ProfilePicture,
                        as: "profile_pictures",
                        attributes: ["tiny_resolution"],
                    },
                ],
            },
            {
                model: CommentStatistic,
                as: "comment_statistic",
                attributes: ["total_likes_num"],
            },
        ],
        limit: pageSize,
        offset,
    })

    const comments_formatted = await Promise.all(
        comments.map(async (comment: any) => {
            // @ts-ignore
            const liked = await CommentLike.findOne({
                where: { user_id, comment_id: comment.id },
            })
            return {
                id: comment.id,
                content: comment.content,
                user: {
                    id: comment.user.id,
                    username: comment.user.username,
                    verifyed: comment.user.verifyed,
                    profile_picture: {
                        tiny_resolution: comment.user.profile_pictures?.tiny_resolution,
                    }, // Corrigido para pegar a resolução correta
                },
                is_liked: Boolean(liked),
                statistics: comment.comment_statistic,
                created_at: comment.createdAt,
            }
        })
    )

    const totalPages = Math.ceil(count / pageSize)

    return {
        comments: comments_formatted,
        count,
        totalPages,
        currentPage: page,
        pageSize,
    }
}

export async function find_moment_statistics_view({
    moment_id,
    user_id,
}: FindMomentStatisticsViewProps) {
    // @ts-ignore
    const statistic = (await Statistic.findOne({
        where: { moment_id },
        attributes: [
            "total_likes_num",
            "total_views_num",
            "total_shares_num",
            "total_comments_num",
            "moment_id",
        ],
    })) as any

    const moment_from_statistic = await Moment.findOne({
        where: { id: statistic.moment_id },
        attributes: ["user_id", "id"],
    })

    if (!moment_from_statistic)
        throw new InternalServerError({ message: "Error to find moment from statistic." })

    if (moment_from_statistic.user_id !== user_id)
        throw new UnauthorizedError({
            message: "Only the user who owns that moment can view their statistics.",
            action: "Check if this user is the creator of the moment.",
        })

    return {
        total_likes_num: statistic.total_likes_num,
        total_views_num: statistic.total_views_num,
        total_shares_num: statistic.total_shares_num,
        total_comments_num: statistic.total_comments_num,
    }
}
export async function find_moment_tags({ moment_id }: FindMomentTagsProps) {
    // @ts-ignore
    const tags_arr = await MomentTags.findAll({
        where: { moment_id },
        attributes: [],
        include: [
            {
                model: Tag,
                as: "tag",
                attributes: ["id", "title"],
            },
        ],
    })
    return tags_arr.map((i: any) => {
        return { id: i.tag.id, title: i.tag.title }
    })
}
