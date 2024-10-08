import { WTF } from "../../WTF"
import { ValidationError } from "../../errors"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists"
import { Relation } from "../../helpers/relation"
import { default as Follow, default as FollowModel } from "../../models/user/follow-model.js"
import ProfilePicture from "../../models/user/profilepicture-model.js"
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
        last_active_at: user.last_active_at,
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

export async function find_user_followers({ user_pk, user_id }) {
    const userFollowers = await FollowModel.findAll({
        where: { followed_user_id: user_pk },
        attributes: ["user_id"],
    })

    console.log({ user_id, user_pk })

    console.log({ usersList: JSON.stringify(userFollowers) })

    const list = userFollowers.map((user) => {
        return { id: user.user_id }
    })
    const rankedUsers = await usersRankerAlgorithm({ userId: user_id, usersList: list })

    return rankedUsers
}
export async function find_user_data({ username, user_id }: FindUserDataProps) {
    if ((await FindUserAlreadyExists({ username })) === false) {
        throw new ValidationError({
            message: "this username cannot exists",
            statusCode: 200,
        })
    } else {
        const user = await User.findOne({
            where: { username },
        })
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

    const profile_picture = await ProfilePicture.findOne({
        attributes: ["fullhd_resolution", "tiny_resolution"],
        where: { user_id: user.id },
    })

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
    return {
        total_followers_num: statistic.total_followers_num,
        total_likes_num: statistic.total_likes_num,
        total_views_num: statistic.total_views_num,
    }
}
