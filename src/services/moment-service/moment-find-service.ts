import { Op } from "sequelize"
import { swipeEngineApi } from "../../apis/swipe-engine"
import { InternalServerError, UnauthorizedError } from "../../errors"
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
    UserType,
} from "./types"

export async function find_user_feed_moments({
    interaction_queue,
    user_id,
}: FindUserFeedMomentsProps) {
    try {
        return await swipeEngineApi
            .post("/moments/get/feed", { interaction_queue: { ...interaction_queue, user_id } })
            .then(async function (response) {
                return await Promise.all(
                    response.data.map(async (moment_id) => {
                        const moment_with_midia: MomentProps = await populateMoment({
                            moment_id,
                            statistic: true,
                            stats: false,
                            metadata: false,
                            midia: true,
                        })

                        const moment_user_id = await Moment.findOne({
                            where: { id: moment_with_midia.id },
                            attributes: ["user_id"],
                        })

                        if (!moment_user_id)
                            throw new InternalServerError({
                                message: "Error to find moment owner.",
                            })

                        const moment_user_followed = await Follow.findOne({
                            where: {
                                user_id,
                                followed_user_id: moment_user_id.user_id,
                            },
                        })
                        const moment_liked = await Like.findOne({
                            where: {
                                user_id,
                                liked_moment_id: moment_id,
                            },
                        })
                        const moment_user = (await User.findOne({
                            where: { id: moment_user_id.user_id },
                            attributes: ["id", "username", "verifyed"],
                            include: [
                                {
                                    model: ProfilePicture,
                                    as: "profile_pictures",
                                    attributes: ["fullhd_resolution", "tiny_resolution"],
                                },
                            ],
                        })) as UserType

                        const { count, rows: comments } = await Comment.findAndCountAll({
                            where: { moment_id: moment_with_midia.id },
                            attributes: ["id", "content", "created_at", "user_id"],
                        })

                        const comments_with_likes = await Promise.all(
                            comments.map(async (comment) => {
                                const statistic = await CommentStatistic.findOne({
                                    where: { comment_id: comment.id },
                                    attributes: ["total_likes_num"],
                                })
                                return {
                                    ...comment.dataValues,
                                    statistics: statistic,
                                }
                            })
                        )

                        // Ordenar o array de comentários com base no número de likes (em ordem decrescente)
                        const sortedComments = comments_with_likes
                            .sort(
                                (a, b) =>
                                    b.statistics.total_likes_num - a.statistics.total_likes_num
                            )
                            .slice(0, 2)

                        const returnsComments = await Promise.all(
                            sortedComments.map(async (comment: any) => {
                                const user = (await User.findOne({
                                    where: { id: comment.user_id },
                                    attributes: ["id", "username", "verifyed"],
                                    include: [
                                        {
                                            model: ProfilePicture,
                                            as: "profile_pictures",
                                            attributes: ["fullhd_resolution", "tiny_resolution"],
                                        },
                                    ],
                                })) as UserType

                                if (!user)
                                    throw new InternalServerError({
                                        message: "Error to find comment owner.",
                                    })

                                delete comment["user_id"]

                                return {
                                    ...comment,
                                    user: {
                                        id: user.id,
                                        username: user.username,
                                        verifyed: user.verifyed,
                                        profile_picture: {
                                            small_resolution:
                                                user.profile_pictures.fullhd_resolution,
                                            tiny_resolution: user.profile_pictures.tiny_resolution,
                                        },
                                    },
                                }
                            })
                        )

                        return {
                            ...moment_with_midia,
                            user: {
                                id: moment_user.id,
                                username: moment_user.username,
                                verifyed: moment_user.verifyed,
                                profile_picture: {
                                    small_resolution:
                                        moment_user.profile_pictures.fullhd_resolution,
                                    tiny_resolution: moment_user.profile_pictures.tiny_resolution,
                                },
                                you_follow: Boolean(moment_user_followed),
                            },
                            comments: {
                                count,
                                comments: returnsComments,
                            },
                            is_liked: Boolean(moment_liked),
                        }
                    })
                )
            })
            .catch(function (error) {
                console.log(error)
            })
    } catch (err) {
        throw new InternalServerError({
            message: "error when searching for moments in swipe-engine-api",
        })
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
        const memory_moments = await MemoryMoment.findAll({ where: { memory_id } })
        console.log(memory_moments)
        const memoryMomentsIds = memory_moments.map((i: any) => i.moment_id)

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
        comments.map(async (comment) => {
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
    const statistic = await Statistic.findOne({
        where: { moment_id },
        attributes: [
            "total_likes_num",
            "total_views_num",
            "total_shares_num",
            "total_comments_num",
            "moment_id",
        ],
    })

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
    return tags_arr.map((i) => {
        return { id: i.tag.id, title: i.tag.title }
    })
}
