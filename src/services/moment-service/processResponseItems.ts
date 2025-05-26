import { MomentProps, UserType } from "./types"

import Comment from "../../models/comments/comment-model.js"
import CommentStatistic from "../../models/comments/comment_statistics-model.js"
import Follow from "../../models/user/follow-model"
import { InternalServerError } from "../../errors"
import Like from "../../models/moments/like-model"
import Moment from "../../models/moments/moment-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import User from "../../models/user/user-model"
import { populateMoment } from "../../helpers/populate-moments"
import { processInteraction } from "../../swipe-engine/services"

// Função auxiliar para processar os itens da resposta
export async function processResponseItems(moment_ids: string[], user_id: bigint | string) {
    return await Promise.all(
        moment_ids.map(async (moment_id) => {
            try {
                // Converter moment_id de string para bigint para compatibilidade com o populateMoment
                const bigintMomentId = BigInt(moment_id)

                const moment_with_midia: MomentProps = await populateMoment({
                    moment_id: bigintMomentId,
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

                // @ts-ignore
                const { count, rows: comments } = await Comment.findAndCountAll({
                    where: { moment_id: moment_with_midia.id },
                    attributes: ["id", "content", "created_at", "user_id"],
                })

                const comments_with_likes = await Promise.all(
                    comments.map(async (comment: any) => {
                        // @ts-ignore
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
                    .sort((a, b) => b.statistics.total_likes_num - a.statistics.total_likes_num)
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
                                    small_resolution: user.profile_pictures.fullhd_resolution,
                                    tiny_resolution: user.profile_pictures.tiny_resolution,
                                },
                            },
                        }
                    })
                )

                // Registrar visualização como interação no novo sistema
                try {
                    await processInteraction(user_id.toString(), moment_id, "short_view", {
                        source: "feed",
                    })
                } catch (error) {
                    // Falha silenciosa para não interromper o feed
                    console.error("Falha ao registrar interação:", error)
                }

                return {
                    ...moment_with_midia,
                    user: {
                        id: moment_user.id,
                        username: moment_user.username,
                        verifyed: moment_user.verifyed,
                        profile_picture: {
                            small_resolution: moment_user.profile_pictures.fullhd_resolution,
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
            } catch (error) {
                console.error(`Erro ao processar momento ${moment_id}:`, error)
                return null
            }
        })
    ).then((results) => results.filter(Boolean)) // Filtrar itens que tiveram erro e retornaram null
}