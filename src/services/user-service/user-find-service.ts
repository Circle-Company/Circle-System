import { ValidationError } from "../../errors"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists"
import { SearchEngine } from "../../search_engine"
import { UserRecommenderEngine } from "../../user_recommender_engine"
import { Relation } from "../../helpers/relation"
import {
    FindUserByUsernameProps,
    FindUserDataProps,
    UserSearchProps,
    RecommenderUsersProps
} from "./types"

const User = require('../../models/user/user-model.js')
const Statistic = require('../../models/user/statistic-model.js')
const Follow = require('../../models/user/follow-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')

export async function find_user_by_username ({
    user_id,
    username
}: FindUserByUsernameProps) {
    if(await FindUserAlreadyExists({ username }) === false) {
        throw new ValidationError({
            message: 'this username cannot exists',
        })
    } else {
        const user = await User.findOne({ where: { username }})
        await Relation.AutoAdd({
            user_id: user_id,
            related_user_id: user.id,
            weight: 1
        })    
        const user_followed = await Follow.findOne({
            attributes: ['followed_user_id', 'user_id'],
            where: { followed_user_id: user.id, user_id}
        })
        const statistic = await Statistic.findOne({
            attributes: ['total_followers_num', 'total_likes_num', 'total_views_num'],
            where: {user_id: user.id}
        })
        const profile_picture = await ProfilePicture.findOne({
            attributes: ['fullhd_resolution', 'tiny_resolution'],
            where: {user_id: user.id}
        })
           
     
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
                tiny_resolution: profile_picture.tiny_resolution
            },
            statistics: {
                total_followers_num:statistic.total_followers_num,
                total_likes_num: statistic.total_likes_num,
                total_views_num:statistic.total_views_num
            },
            you_follow:  Boolean(user_followed)
        }
    }
}
export async function find_user_data ({
    username,
    user_id
}: FindUserDataProps) {
    if(await FindUserAlreadyExists({ username }) === false) {
        throw new ValidationError({
            message: 'this username cannot exists',
            statusCode: 200
        })
    } else {
        const user = await User.findOne({ where: { username }})
        const profile_picture = await ProfilePicture.findOne({
            where: {user_id: user.id}
        })
        await Relation.AutoAdd({
            user_id: user_id,
            related_user_id: user.id,
            weight: 1
        })     
        
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            description: user.description,
            access_level: user.access_level,
            verifyed: user.verifyed,
            deleted: user.deleted,
            blocked: user.blocked,
            muted: user.muted,
            terms_and_conditions_agreed_version: user.terms_and_conditions_agreed_version,
            terms_and_conditions_agreed_at: user.terms_and_conditions_agreed_at,
            last_active_at: user.last_active_at,
            send_notification_emails: user.send_notification_emails,
            profile_picture: {
                id: profile_picture.id,
                fullhd_resolution: profile_picture.fullhd_resolution,
                tiny_resolution: profile_picture.tiny_resolution,
                created_at: profile_picture.createdAt,
                updated_at: profile_picture.updatedAt
            }
        }
    }
}
export async function search_user ({
    username_to_search, user_id
}: UserSearchProps) {
    return await SearchEngine({search_term: username_to_search, user_id})
}
export async function recommender_users ({
    user_id
}: RecommenderUsersProps) {
    return await UserRecommenderEngine({user_id})
}