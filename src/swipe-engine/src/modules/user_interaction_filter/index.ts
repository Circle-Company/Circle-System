import Block from '../../models/user/block-model.js'
import Report from '../../models/user/report-model.js'
import Share from '../../models/moments/share-model.js'
import View from '../../models/moments/view-model.js'
import Moment from '../../models/moments/moment-model.js'
import Like from '../../models/moments/like-model.js'
import Relation from '../../models/user/relation-model.js'
import Skip from '../../models/moments/skip-model.js'
import Follow from '../../models/user/follow-model.js'

type UserModerationLayerProps = {
    userId: number
    momentsIdsList: number[]
    options: {
        allowBlocked?: boolean
        allowFollowed?: boolean
        allowRelated?: boolean
        allowShared?: boolean
        allowViewed?: boolean
        allowReported?: boolean
        allowLiked?: boolean
        allowSkipped?: boolean
    }
}

export default async function UserInteractionFilter({
    userId,
    momentsIdsList,
    options: {
        allowBlocked = false,
        allowFollowed = true,
        allowRelated = true,
        allowShared = false,
        allowViewed = false,
        allowReported = false,
        allowLiked = false,
        allowSkipped = false
    }
}: UserModerationLayerProps): Promise<any>  {

    const moment_owners_ids_list = await Promise.all(
        momentsIdsList.map(async (id) => {
            const moment = await Moment.findOne({
                where: {id}, attributes: ['user_id', 'id']
            })

            return {user_id: moment.user_id, moment_id: moment.id}
        })
    )

    const populated_moments = await Promise.all(
        moment_owners_ids_list.map(async(i) => {
            const is_blocked = await Block.findOne({
                where: {user_id:userId, blocked_user_id: i.user_id},
                attributes: ['user_id', 'blocked_user_id']
            })
            const is_followed = await Follow.findOne({
                where: {user_id:userId, followed_user_id: i.user_id},
                attributes: ['user_id', 'followed_user_id']
            })
            const is_related = await Relation.findOne({
                where: {user_id:userId, related_user_id: i.user_id},
                attributes: ['user_id', 'related_user_id']
            })

            const is_shared = await Share.findOne({
                where: { user_id: userId, shared_moment_id: i.moment_id }
            })
            const is_viewed = await View.findOne({
                where: { user_id: userId, viewed_moment_id: i.moment_id }
            })
            const is_reported = await Report.findOne({
                where: { user_id: userId, reported_content_id: i.moment_id }
            })
            const is_liked = await Like.findOne({
                where: { user_id: userId, liked_moment_id: i.moment_id }
            })
            const is_skipped = await Skip.findOne({
                where: { user_id: userId, skipped_moment_id: i.moment_id }
            })

            return {
                id: i.moment_id,
                owner_user_id: i.user_id,
                is_blocked: Boolean(is_blocked),
                is_followed: Boolean(is_followed),
                is_related: Boolean(is_related),             
                is_shared: Boolean(is_shared),
                is_viewed: Boolean(is_viewed),
                is_reported: Boolean(is_reported),
                is_liked: Boolean(is_liked),
                is_skipped: Boolean(is_skipped)
            }
        }) 
    )

    const filtered_moments = populated_moments.filter(moment => {
        return (
            (allowBlocked === undefined || allowBlocked === moment.is_blocked) &&
            (allowFollowed === undefined || allowFollowed === moment.is_followed) &&
            (allowRelated === undefined || allowRelated === moment.is_related) &&
            (allowShared === undefined || allowShared === moment.is_shared) &&
            (allowViewed === undefined || allowViewed === moment.is_viewed) &&
            (allowReported === undefined || allowReported === moment.is_reported) &&
            (allowLiked === undefined || allowLiked === moment.is_liked) &&
            (allowSkipped === undefined || allowSkipped === moment.is_skipped)
        );
    })
    return await filtered_moments.map((moment) => {return { id: moment.id }})
}