import { WTF } from "../../WTF"
import { InternalServerError, ValidationError } from "../../errors"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists"
import { Relation } from "../../helpers/relation"
import { default as Follow, default as FollowModel } from "../../models/user/follow-model.js"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model.js"
import User from "../../models/user/user-model.js"
import { TriggerNotification } from "../../notification-service"
import { SearchEngine } from "../../search_engine"

import { usersRankerAlgorithm } from "../../algorithms/users-ranker"
import {
    FindUserByUsernameProps,
    FindUserDataProps,
    RecommenderUsersProps,
    UserSearchProps,
} from "./types"

export async function find_user_by_username({ user_id, username }: FindUserByUsernameProps) {
    const user = await User.findOne({ where: { username } })
    if (!user) throw new InternalServerError({ message: "Can´t possible find this user" })
    await Relation.AutoAdd({
        user_id: user_id,
        related_user_id: user.id,
        weight: 1,
    })
    const user_followed = await Follow.findOne({
        attributes: ["followed_user_id", "user_id"],
        where: { followed_user_id: user.id, user_id },
    })
    const statistic = await Statistic.findOne({
        attributes: ["total_followers_num", "total_likes_num", "total_views_num"],
        where: { user_id: user.id },
    })
    const profile_picture = await ProfilePicture.findOne({
        attributes: ["fullhd_resolution", "tiny_resolution"],
        where: { user_id: user.id },
    })

    if (!user) throw new InternalServerError({ message: "Can´t possible find this user." })
    if (!statistic)
        throw new InternalServerError({ message: "Can´t possible find this user statistic." })
    if (!profile_picture)
        throw new InternalServerError({ message: "Can´t possible find this user picture." })

    if (user_id !== user.id) {
        await TriggerNotification({
            notification: {
                type: "VIEW-USER",
                data: {
                    senderUserId: user_id,
                    receiverUserId: user.id,
                },
            },
        })
    }

    return {
        id: user.id,
        username: user.username,
        access_level: user.access_level,
        verifyed: user.verifyed,
        deleted: user.deleted,
        blocked: user.blocked,
        muted: user.muted,
        send_notification_emails: user.send_notification_emails,
        name: user.name,
        description: user.description,
        profile_picture: {
            fullhd_resolution: profile_picture.fullhd_resolution,
            tiny_resolution: profile_picture.tiny_resolution,
        },
        statistics: {
            total_followers_num: statistic.total_followers_num,
            total_likes_num: statistic.total_likes_num,
            total_views_num: statistic.total_views_num,
        },
        you_follow: Boolean(user_followed),
    }
}

export async function find_user_by_pk({ user_id, user_pk }: { user_id: number; user_pk: string }) {
    const user = await User.findOne({ where: { id: user_pk } })
    if (!user) throw new InternalServerError({ message: "Can´t possible find this user" })

    const user_followed = await Follow.findOne({
        attributes: ["followed_user_id", "user_id"],
        where: { followed_user_id: user.id, user_id },
    })
    const statistic = await Statistic.findOne({
        attributes: ["total_followers_num", "total_likes_num", "total_views_num"],
        where: { user_id: user.id },
    })
    const profile_picture = await ProfilePicture.findOne({
        attributes: ["fullhd_resolution", "tiny_resolution"],
        where: { user_id: user.id },
    })

    if (!user_followed)
        throw new InternalServerError({ message: "Can´t possible find followed user." })
    if (!statistic)
        throw new InternalServerError({ message: "Can´t possible find this user statistic." })
    if (!profile_picture)
        throw new InternalServerError({ message: "Can´t possible find this user picture." })

    if (BigInt(user_id) !== user.id) {
        await TriggerNotification({
            notification: {
                type: "VIEW-USER",
                data: {
                    senderUserId: BigInt(user_id),
                    receiverUserId: user.id,
                },
            },
        })
    }
    return {
        id: user.id,
        username: user.username,
        verifyed: user.verifyed,
        name: user.name,
        description: user.description,
        profile_picture: {
            small_resolution: profile_picture.fullhd_resolution,
            tiny_resolution: profile_picture.tiny_resolution,
        },
        statistics: {
            total_followers_num: statistic?.total_followers_num,
            total_likes_num: statistic?.total_likes_num,
            total_views_num: statistic?.total_views_num,
        },
        you_follow: Boolean(user_followed),
    }
}

export async function find_user_followers({
    user_pk,
    user_id,
    page,
    pageSize,
}: {
    user_pk: bigint
    user_id: bigint
    page: number
    pageSize: number
}) {
    const offset = (page - 1) * pageSize
    const { count, rows: userFollowers } = await FollowModel.findAndCountAll({
        where: { followed_user_id: String(user_pk) },
        attributes: ["user_id", "created_at"],
        order: [["created_at", "DESC"]],
        limit: pageSize,
        offset,
        include: [
            {
                model: User,
                where: { blocked: false, deleted: false },
                as: "following",
                attributes: ["id", "username", "verifyed"],
                include: [
                    {
                        model: ProfilePicture,
                        as: "profile_pictures",
                        attributes: ["tiny_resolution"],
                    },
                ],
            },
        ],
    })

    const userFollowersFormatted = userFollowers.map((user: any) => {
        return {
            id: user.following.id,
            username: user.following.username,
            verifyed: user.following.verifyed,
            profile_picture: user.following.profile_pictures,
            created_at: user.created_at,
        }
    })

    const totalPages = count ? Math.ceil(count / pageSize) : 1

    const list = userFollowersFormatted?.map((user) => {
        return { id: user.id }
    })
    const rankedUsers = list ? await usersRankerAlgorithm({ userId: user_id, usersList: list }) : []

    const rankedusersPopulated = await Promise.all(
        rankedUsers.map(async (user) => {
            const userData: any = await User.findOne({
                where: { id: user.id },
                attributes: ["id", "username"],
                order: [["created_at", "DESC"]],
                limit: pageSize,
                offset,
                include: [
                    {
                        model: ProfilePicture,
                        as: "profile_pictures",
                        attributes: ["tiny_resolution"],
                    },
                ],
            })
            if (!userData)
                throw new InternalServerError({
                    message: "Can´t possible find users.",
                    action: "try again.",
                })
            return {
                id: user.id,
                username: userData.username,
                verifyed: user.verifyed,
                profile_picture: { tiny_resolution: userData.profile_pictures.tiny_resolution },
                you_follow: user.you_follow,
            }
        })
    )

    return {
        users: rankedusersPopulated,
        totalPages,
        currentPage: page,
        pageSize,
    }
}
export async function find_user_data({ username, user_id }: FindUserDataProps) {
    if ((await FindUserAlreadyExists({ username })) === false) {
        throw new ValidationError({
            message: "this username cannot exists",
        })
    } else {
        const user = await User.findOne({
            where: { username },
        })
        if (!user) throw new InternalServerError({ message: "Can´t possible find this user." })
        const profile_picture = await ProfilePicture.findOne({
            attributes: ["fullhd_resolution", "tiny_resolution"],
            where: { user_id: user.id },
        })

        const statistics = await Statistic.findOne({
            attributes: ["total_followers_num", "total_likes_num", "total_views_num"],
            where: { user_id: user.id },
        })

        if (user_id !== user.id) {
            await Relation.AutoAdd({
                user_id: user_id,
                related_user_id: user.id,
                weight: 1,
            })
        }

        if (user_id !== user.id) {
            await TriggerNotification({
                notification: {
                    type: "VIEW-USER",
                    data: {
                        senderUserId: user_id,
                        receiverUserId: user.id,
                    },
                },
            })
        }

        return {
            id: user.id,
            username: user.username,
            name: user.name,
            description: user.description,
            verifyed: user.verifyed,
            profile_picture,
            statistics,
        }
    }
}
export async function search_user({ username_to_search, user_id }: UserSearchProps) {
    return await SearchEngine({ search_term: username_to_search, user_id })
}
export async function recommender_users({ user_id }: RecommenderUsersProps) {
    return await WTF({ user_id })
}

export async function find_session_user_by_pk({ user_pk }: { user_pk: string }) {
    const user = await User.findOne({ where: { id: user_pk } })

    if (!user) throw new InternalServerError({ message: "Can´t possible find this user" })

    const profile_picture = await ProfilePicture.findOne({
        attributes: ["fullhd_resolution", "tiny_resolution"],
        where: { user_id: user.id },
    })

    if (!profile_picture)
        throw new InternalServerError({ message: "Can´t possible find this user picture" })

    return {
        id: user.id,
        username: user.username,
        verifyed: user.verifyed,
        name: user.name,
        description: user.description,
        profile_picture: {
            small_resolution: profile_picture.fullhd_resolution,
            tiny_resolution: profile_picture.tiny_resolution,
        },
    }
}

export async function find_session_user_statistics_by_pk({ user_pk }: { user_pk: string }) {
    const statistic = await Statistic.findOne({
        where: { user_id: user_pk },
    })

    if (!statistic)
        throw new InternalServerError({ message: "Can´t possible find this user statistic" })

    return {
        total_followers_num: statistic.total_followers_num,
        total_likes_num: statistic.total_likes_num,
        total_views_num: statistic.total_views_num,
    }
}
