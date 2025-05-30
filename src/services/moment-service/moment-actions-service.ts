import {
    CommentOnMomentProps,
    DeleteMomentProps,
    HideMomentProps,
    LikeCommentProps,
    ReplyCommentOnMomentProps,
    UndeleteMomentProps,
    UnhideMomentProps,
    UnlikeCommentProps,
} from "./types"
import { InternalServerError, UnauthorizedError } from "../../errors"

import Comment from "../../models/comments/comment-model.js"
import CommentLike from "../../models/comments/comment_likes-model.js"
import CommentStatistic from "../../models/comments/comment_statistics-model.js"
import Like from "../../models/moments/like-model"
import Memory from "../../models/memories/memory-model"
import MemoryMoment from "../../models/memories/memory_moments-model"
import Moment from "../../models/moments/moment-model"
import MomentStatistic from "../../models/moments/moment_statistic-model.js"
import { Notification } from "../../helpers/notification"
import ProfileClick from "../../models/moments/profile_click-model.js"
import { Relation } from "../../helpers/relation"
import SecurityToolKit from "security-toolkit"
import Share from "../../models/moments/share-model.js"
import Skip from "../../models/moments/skip-model.js"
import UserStatistic from "../../models/user/statistic-model"
import View from "../../models/moments/view-model.js"

export async function like_moment({ moment_id, user_id }) {
    try {
        const like_exists = await Like.findOne({ where: { user_id, liked_moment_id: moment_id } })
        if (like_exists)
            throw new UnauthorizedError({ message: "this user has already liked it at the moment" })
        else {
            const moment = await Moment.findOne({
                where: { id: moment_id },
                attributes: ["user_id", "id"],
            })
            if (!moment)
                throw new UnauthorizedError({ message: "Can´t possible find this moment." })

            await Promise.all([
                Like.create({ liked_moment_id: moment_id, user_id }),
                // @ts-ignore
                MomentStatistic.increment("total_likes_num", { by: 1, where: { moment_id } }),
                UserStatistic.increment("total_likes_num", {
                    by: 1,
                    where: { user_id: moment.user_id },
                }),
                Relation.AutoAdd({
                    user_id: user_id,
                    related_user_id: moment.user_id,
                    weight: 0.1,
                }),
                Notification.AutoSend({
                    sender_user_id: user_id,
                    receiver_user_id: moment.user_id,
                    type: "LIKE-MOMENT",
                    content_id: moment.id,
                }),
            ])

            return { message: "moment was successfully liked" }
        }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
export async function unlike_moment({ moment_id, user_id }) {
    try {
        const like_exists = await Like.findOne({ where: { user_id, liked_moment_id: moment_id } })
        if (!like_exists)
            throw new UnauthorizedError({ message: "This user did not like at the moment" })
        await Like.destroy({ where: { liked_moment_id: moment_id, user_id } })
        // @ts-ignore
        const momentStatistics = (await MomentStatistic.findOne({
            where: { moment_id },
            attributes: ["total_likes_num"],
        })) as any
        if (momentStatistics.total_likes_num < 0)
            // @ts-ignore
            await MomentStatistic.update({ total_likes_num: 0 }, { where: { moment_id } })
        else if (momentStatistics.total_likes_num > 0) {
            // @ts-ignore
            await MomentStatistic.increment("total_likes_num", { by: -1, where: { moment_id } })
            await UserStatistic.increment("total_likes_num", {
                by: -1,
                where: { user_id: user_id },
            })
        }
        return { message: "moment was successfully unliked" }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
export async function view_moment({ moment_id, user_id }) {
    try {
        const moment = await Moment.findOne({ where: { id: moment_id }, attributes: ["user_id"] })
        if (!moment) throw new UnauthorizedError({ message: "Can´t possible find this moment." })
        // @ts-ignore
        await View.create({ viewed_moment_id: moment_id, user_id })
        // @ts-ignore
        await MomentStatistic.increment("total_views_num", { by: 1, where: { moment_id } })
        await UserStatistic.increment("total_views_num", {
            by: 1,
            where: { user_id: moment.user_id },
        })
        return { message: "moment was successfully viewed" }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
export async function share_moment({ moment_id, user_id }) {
    try {
        // @ts-ignore
        await Share.create({ shared_moment_id: moment_id, user_id })
        // @ts-ignore
        await MomentStatistic.increment("total_shares_num", { by: 1, where: { moment_id } })
        return { message: "moment was successfully shared" }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
export async function skip_moment({ moment_id, user_id }) {
    try {
        // @ts-ignore
        await Skip.create({ skipped_moment_id: moment_id, user_id })
        // @ts-ignore
        await MomentStatistic.increment("total_skips_num", { by: 1, where: { moment_id } })
        return { message: "moment was successfully skipped" }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
export async function profile_click_moment({ moment_id, user_id }) {
    try {
        // @ts-ignore
        await ProfileClick.create({ profile_clicked_moment_id: moment_id, user_id })
        // @ts-ignore
        await MomentStatistic.increment("total_profile_clicks_num", { by: 1, where: { moment_id } })
        return { message: "moment was successfully profile clicked" }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
export async function comment_on_moment({ moment_id, content, user_id }: CommentOnMomentProps) {
    try {
        const sanitization = new SecurityToolKit().sanitizerMethods.sanitizeSQLInjection(content)
        // @ts-ignore
        const comment = await Comment.create({
            user_id,
            moment_id,
            content: sanitization.sanitized,
            parent_comment_id: undefined,
        })
        // @ts-ignore
        await CommentStatistic.create({ comment_id: comment.id })
        // @ts-ignore
        await MomentStatistic.increment("total_comments_num", { by: 1, where: { moment_id } })
        const moment = await Moment.findOne({ where: { id: moment_id }, attributes: ["user_id"] })
        if (!moment) throw new UnauthorizedError({ message: "Can´t possible find this moment." })

        await Notification.AutoSend({
            sender_user_id: user_id,
            receiver_user_id: moment.user_id,
            type: "COMMENT-MOMENT",
            content_id: moment.id,
        })
        return { message: "comment was successfully created" }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
export async function reply_comment_on_moment({
    moment_id,
    content,
    parent_comment_id,
    user_id,
}: ReplyCommentOnMomentProps) {
    try {
        const sanitization = new SecurityToolKit().sanitizerMethods.sanitizeSQLInjection(content)
        // @ts-ignore
        const comment = await Comment.create({
            user_id,
            moment_id,
            content: sanitization.sanitized,
            parent_comment_id: BigInt(parent_comment_id),
        })
        // @ts-ignore
        await MomentStatistic.increment("total_comments_num", { by: 1, where: { moment_id } })
        // @ts-ignore
        await CommentStatistic.create({ comment_id: comment.id })
        // @ts-ignore
        await CommentStatistic.increment("total_replies_num", {
            by: 1,
            where: { comment_id: parent_comment_id },
        })
        return { message: "comment was successfully replied" }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
export async function like_comment({ comment_id, user_id }: LikeCommentProps) {
    // @ts-ignore
    await CommentStatistic.increment("total_likes_num", { by: 1, where: { comment_id } })
    // @ts-ignore
    const like_exists = await CommentLike.findOne({ where: { user_id, comment_id } })
    if (like_exists)
        throw new UnauthorizedError({
            message: "This user has already liked it at the comment",
        })
    else {
        // @ts-ignore
        const comment = (await Comment.findOne({
            attributes: ["user_id", "id"],
            where: { id: comment_id },
        })) as any
        // @ts-ignore
        await CommentLike.create({ comment_id, user_id })
        // @ts-ignore
        await CommentStatistic.increment("total_likes_num", { by: 1, where: { comment_id } })
        await Relation.AutoAdd({
            user_id: user_id,
            related_user_id: comment.user_id,
            weight: -0.01,
        })
        return { message: "Moment was successfully liked" }
    }
}
export async function unlike_comment({ comment_id, user_id }: UnlikeCommentProps) {
    // @ts-ignore
    const comment_statistic = (await CommentStatistic.findOne({
        where: { comment_id },
        attributes: ["total_likes_num"],
    })) as any
    // @ts-ignore
    const like_exists = await CommentLike.findOne({ where: { user_id, comment_id } })

    if (comment_statistic.total_likes_num <= 0) {
        throw new UnauthorizedError({
            message: "You can't unlike a comment without likes",
        })
    }
    if (!like_exists)
        throw new UnauthorizedError({
            message: "This user has not liked this comment",
        })
    else {
        // @ts-ignore
        const comment = (await Comment.findOne({
            attributes: ["user_id", "id"],
            where: { id: comment_id },
        })) as any
        // @ts-ignore
        await CommentLike.destroy({ where: { comment_id, user_id } })
        // @ts-ignore
        await CommentStatistic.increment("total_likes_num", { by: -1, where: { comment_id } })
        await Relation.AutoAdd({
            user_id: user_id,
            related_user_id: comment.user_id,
            weight: -0.01,
        })
        return { message: "Moment was successfully liked" }
    }
}
export async function hide_moment({ moment_id, user_id }: HideMomentProps) {
    const moment = await Moment.findOne({
        where: { id: moment_id },
        attributes: ["user_id", "id"],
    })
    if (!moment) throw new UnauthorizedError({ message: "Can´t possible find this moment." })

    if (moment.user_id !== user_id) {
        throw new UnauthorizedError({
            message: "This user is not the owner of this moment",
            action: "Make sure this user owns the moment to hide it",
        })
    }
    await Moment.update({ visible: false }, { where: { id: moment_id } })
    return { message: "success in hide moment" }
}
export async function unhide_moment({ moment_id, user_id }: UnhideMomentProps) {
    const moment = await Moment.findOne({
        where: { id: moment_id },
        attributes: ["user_id", "id"],
    })
    if (!moment) throw new UnauthorizedError({ message: "Can´t possible find this moment." })

    if (moment.user_id !== user_id) {
        throw new UnauthorizedError({
            message: "This user is not the owner of this moment",
            action: "Make sure this user owns the moment to unhide it",
        })
    }
    await Moment.update({ visible: true }, { where: { id: moment_id } })
    return { message: "success in unhide moment" }
}
export async function delete_moment({ moment_id, user_id }: DeleteMomentProps) {
    const moment = await Moment.findOne({
        where: { id: moment_id, user_id },
        attributes: ["id", "deleted"],
    })
    if (!moment)
        throw new InternalServerError({
            message: "This moment does not exist.",
            action: "Make sure the ID was passed correctly.",
        })
    if (moment.user_id !== user_id)
        throw new UnauthorizedError({
            message: "This user is not the owner of this moment",
            action: "Make sure this user owns the moment to delete it",
        })
    if (moment.deleted)
        throw new InternalServerError({
            message: "This moment has already been previously deleted",
            action: "Make sure this moment has not be deleted previously",
        })
    else {
        await Moment.update({ deleted: true }, { where: { id: moment_id } })
        const memory_moments = await MemoryMoment.findAll({
            where: { moment_id },
            attributes: ["moment_id", "memory_id"],
        })
        await Promise.all(
            memory_moments.map(async (memory_moment) => {
                const memory = await Memory.findOne({
                    where: { id: memory_moment.memory_id },
                    attributes: ["id"],
                })
                if (!memory)
                    throw new InternalServerError({ message: "Can´t possible find this memory." })
                const memory_moments = await MemoryMoment.findAll({
                    where: { memory_id: memory.id },
                    attributes: ["moment_id", "memory_id"],
                })
                const memory_moments_list = await Promise.all(
                    memory_moments.map(async (memory_moment_in_list) => {
                        return await Moment.findOne({
                            where: { id: memory_moment_in_list.moment_id },
                            attributes: ["id", "deleted"],
                        })
                    })
                )
                const filtered_memory_moments_list = memory_moments_list.filter(
                    (item: any) => !item.deleted
                )
                if (filtered_memory_moments_list.length == 0)
                    Memory.destroy({ where: { id: memory.id } })
                await MemoryMoment.destroy({ where: { moment_id } })
            })
        )

        return { message: "moment deleted successfully" }
    }
}

export async function delete_moment_list({
    moment_ids_list,
    user_id,
}: {
    moment_ids_list: bigint[]
    user_id: bigint
}) {
    await Promise.all(
        moment_ids_list.map(async (id) => {
            const moment = await Moment.findOne({
                where: { id: id, user_id },
                attributes: ["id", "deleted"],
            })
            if (!moment)
                throw new InternalServerError({
                    message: "This moment does not exist.",
                    action: "Make sure the ID was passed correctly.",
                })
            if (moment.user_id !== user_id)
                throw new UnauthorizedError({
                    message: "This user is not the owner of this moment",
                    action: "Make sure this user owns the moment to delete it",
                })
            if (moment.deleted)
                throw new InternalServerError({
                    message: "This moment has already been previously deleted",
                    action: "Make sure this moment has not be deleted previously",
                })
            await Moment.update({ deleted: true, visible: false }, { where: { id } })
        })
    )

    return { message: `moments deleted successfully` }
}
export async function undelete_moment({ moment_id, user_id }: UndeleteMomentProps) {
    const moment = await Moment.findOne({
        where: { id: moment_id, user_id },
        attributes: ["id", "deleted"],
    })
    if (!moment)
        throw new InternalServerError({
            message: "This moment does not exist.",
            action: "Make sure the ID was passed correctly.",
        })
    if (moment.user_id !== user_id)
        throw new UnauthorizedError({
            message: "This user is not the owner of this moment",
            action: "Make sure this user owns the moment to undelete it",
        })
    if (moment.deleted)
        throw new InternalServerError({
            message: "This moment has already been previously undeleted",
            action: "Make sure this moment has not be undeleted previously",
        })
    await Moment.update({ deleted: false, visible: true }, { where: { id: moment_id } })
    return { message: "moment undeleted successfully" }
}
