// @ts-nocheck
import MomentMidia from "models/moments/moment_midia-model"
import { Op } from "sequelize"
import { InternalServerError, UnauthorizedError } from "../../errors"
import { populateMoment } from "../../helpers/populate-moments"
import { default as Comment } from "../../models/comments/comment-model.js"
import CommentLike from "../../models/comments/comment_likes-model.js"
import CommentStatistic from "../../models/comments/comment_statistics-model.js"
import MemoryMoment from "../../models/memories/memory_moments-model"
import { default as Like, default as MomentLike } from "../../models/moments/like-model"
import Moment from "../../models/moments/moment-model"
import Statistic from "../../models/moments/moment_statistic-model.js"
import Tag from "../../models/tags/tag-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import User from "../../models/user/user-model"
import {
    FindMomentStatisticsViewProps,
    FindMomentTagsProps,
    FindUserMomentsProps,
    FindUserMomentsTinyExcludeMemoryProps,
    MomentProps,
} from "./types"

interface MomentProps {
    id: bigint
    description: string
    created_at: Date
    user_id: bigint
    midia?: {
        content_type: string
        nhd_resolution: string
        fullhd_resolution: string
    }
    statistics?: {
        total_likes_num: number
        total_comments_num: number
        total_shares_num: number
    }
    visible: boolean
    blocked: boolean
}

export async function find_user_feed_moments(
    user_id: bigint,
    moment_ids: bigint[]
): Promise<MomentProps[]> {
    // Validações iniciais
    if (!user_id) {
        console.error("[find_user_feed_moments] user_id é obrigatório")
        return []
    }

    const moments = await Moment.findAll({
        where: {
            deleted: false,
            visible: true,
            blocked: false,
        },
        include: [
            {
                model: MomentMidia,
                as: "moment_midias",
                attributes: ["content_type", "nhd_resolution", "fullhd_resolution"],
                required: false,
            },
            {
                model: MomentLike,
                as: "likes",
                attributes: ["user_id"],
                required: false,
            },
            {
                model: Statistic,
                as: "moment_statistics",
                attributes: ["total_likes_num", "total_comments_num", "total_shares_num"],
                required: false,
            },
            {
                model: User,
                as: "user",
                attributes: ["id", "username", "blocked"],
                required: true,
                where: {
                    blocked: false,
                },
            },
        ],
        attributes: ["id", "description", "created_at", "user_id", "visible", "blocked"],
        order: [["created_at", "DESC"]],
    })

    if (!moments || !Array.isArray(moments)) {
        return []
    }

    // Buscar os 2 comentários mais curtidos para cada momento
    const momentsWithTopComments = await Promise.all(
        moments.map(async (moment) => {
            const topComments = await Comment.findAll({
                where: { moment_id: moment.id },
                attributes: ["id", "content", "created_at"],
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
                order: [
                    [
                        { model: CommentStatistic, as: "comment_statistic" },
                        "total_likes_num",
                        "DESC",
                    ],
                ],
                limit: 2,
            })

            // Verificar se o usuário curtiu cada comentário
            const commentsWithLikeStatus = await Promise.all(
                topComments.map(async (comment) => {
                    const isLiked = await CommentLike.findOne({
                        where: { user_id, comment_id: comment.id },
                    })

                    return {
                        id: comment.id,
                        content: comment.content,
                        created_at: comment.created_at,
                        user: {
                            id: comment.user.id,
                            username: comment.user.username,
                            verifyed: comment.user.verifyed,
                            profile_picture: {
                                tiny_resolution: comment.user.profile_pictures?.tiny_resolution,
                            },
                        },
                        statistics: {
                            total_likes_num: comment.comment_statistic
                                ? comment.comment_statistic.total_likes_num
                                : 0,
                        },
                        is_liked: Boolean(isLiked),
                    }
                })
            )

            return {
                ...moment.toJSON(),
                topComments: commentsWithLikeStatus,
            }
        })
    )

    // Transforma e filtra os resultados com validações
    const validMoments = momentsWithTopComments
        .filter(
            (moment) => moment && moment.moment_midias && moment.moment_statistics && moment.user
        )
        .map((moment) => ({
            id: moment.id,
            description: moment.description,
            created_at: moment.created_at,
            user: {
                id: moment.user.id,
                username: moment.user.username,
            },
            midia: {
                content_type: moment.moment_midias.content_type,
                nhd_resolution: moment.moment_midias.nhd_resolution,
                fullhd_resolution: moment.moment_midias.fullhd_resolution,
            },
            statistics: {
                total_likes_num: moment.moment_statistics.total_likes_num,
                total_comments_num: moment.moment_statistics.total_comments_num,
                total_shares_num: moment.moment_statistics.total_shares_num,
            },
            visible: moment.visible,
            blocked: moment.blocked,
            language: "pt",
            comments: { comments: moment.topComments } || [],
            is_liked:
                moment.likes && Array.isArray(moment.likes)
                    ? moment.likes.some((like) => like.user_id == user_id)
                    : false,
        }))
    console.log(validMoments.map((i) => i.comments))
    return validMoments
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
