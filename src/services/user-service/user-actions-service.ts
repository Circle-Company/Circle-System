import { FollowUserProps, BlockUserProps, ReportUserProps } from "./types"
import { ValidationError } from "../../errors"
import { Relation } from "../../helpers/relation"
const Block = require('../../models/user/block-model.js')
const Follow = require('../../models/user/follow-model.js')
const Statistic = require('../../models/user/statistic-model.js')
const Report = require('../../models/user/report-model.js')
import { Notification } from "../../helpers/notification"

export async function follow_user({
    user_id, followed_user_id
}: FollowUserProps) {
    const find_follow_exists = await Follow.findOne({
        attributes: ['user_id', 'followed_user_id'],
        where: { user_id: user_id, followed_user_id: followed_user_id }
    })

    if(user_id == followed_user_id) {
        throw new ValidationError({
            message: 'The users cannot follow themselves',
        })
    }else if(find_follow_exists) {
        throw new ValidationError({
            message: 'This user has already been followed',
        })
    }else {
        await Follow.create({
            user_id: user_id,
            followed_user_id: followed_user_id
        })
        await Statistic.increment('total_followers_num',{
            by: 1,
            where: { user_id: followed_user_id}
        })  
        await Relation.AutoAdd({
            user_id: user_id,
            related_user_id: followed_user_id,
            weight: 1
        })  
        await Notification.AutoSend({
            sender_user_id: user_id,
            receiver_user_id: followed_user_id,
            type: 'FOLLOW-USER'
        })

    }
}
export async function unfollow_user({
    user_id, followed_user_id
}: FollowUserProps) {
    const find_follow_exists = await Follow.findOne({
        attributes: ['user_id', 'followed_user_id'],
        where: { user_id: user_id, followed_user_id: followed_user_id }
    })

    if(user_id == followed_user_id) {
        throw new ValidationError({
            message: 'The users cannot unfollow themselves',
        })
    }else if(!find_follow_exists) {
        throw new ValidationError({
            message: 'This user has already been unfollowed',
        })
    } else {
        await Follow.destroy({
            where: {
                user_id: user_id,
                followed_user_id: followed_user_id                
            }
        })
        await Statistic.increment('total_followers_num',{
            by: -1,
            where: { user_id: followed_user_id}
        })
        await Relation.AutoAdd({
            user_id: user_id,
            related_user_id: followed_user_id,
            weight: -1
        })    
    }
}
export async function block_user({
    user_id, blocked_user_id
}: BlockUserProps){

    const find_block_exists = await Block.findOne({
        attributes: ['user_id', 'blocked_user_id'],
        where: { user_id: user_id, blocked_user_id: blocked_user_id }
    })

    if(user_id == blocked_user_id) {
        throw new ValidationError({
            message: 'a user cannot block themselves',
        })
    }else if(find_block_exists) {
        throw new ValidationError({
            message: 'this user has already been unlocked',
        })
    } else {
        await Follow.destroy({
            where: {
                user_id: user_id,
                followed_user_id: blocked_user_id                
            }
        })
        await Block.create({
            user_id: user_id,
            blocked_user_id: blocked_user_id
        })
        await Relation.AutoAdd({
            user_id: user_id,
            related_user_id: blocked_user_id,
            weight: -10
        })    
    }

}
export async function unlock_user({
    user_id, blocked_user_id
}: BlockUserProps){

    const find_block_exists = await Block.findOne({
        attributes: ['user_id', 'blocked_user_id'],
        where: { user_id: user_id, blocked_user_id: blocked_user_id }
    })

    if(!find_block_exists) {
        throw new ValidationError({
            message: 'this user has already been unlocked',
        })
    }else {
        await Block.destroy({
            where: {
                user_id: user_id,
                blocked_user_id: blocked_user_id                
            }
        })
        await Relation.AutoAdd({
            user_id: user_id,
            related_user_id: blocked_user_id,
            weight: 2
        })    
    }

}
export async function report_user({
    user_id, reported_content_id, reported_content_type, report_type, 
}: ReportUserProps) {
    const find_report_exists = await Report.findOne({
        attributes: ['user_id', 'reported_content_id'],
        where: { user_id, reported_content_id, reported_content_type, report_type }
    })
    if(find_report_exists) {
        throw new ValidationError({
            message: `This ${reported_content_type} has already been reported`,
        })
    } else if(reported_content_type == 'USER' && user_id == reported_content_id){
        throw new ValidationError({
            message: 'ta user cannot report themselves',
        })
    } else {
        await Report.create({
            user_id,
            reported_content_id,
            reported_content_type,
            report_type
        })
        if(reported_content_type == "USER"){
            await Relation.AutoAdd({
                user_id: user_id,
                related_user_id: reported_content_id,
                weight: -20
            })                
        }

    }
}