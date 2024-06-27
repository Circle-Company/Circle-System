import {
    CommentOnMomentProps,
    ReplyCommentOnMomentProps,
    LikeCommentProps,
    UnlikeCommentProps,
    DeleteMomentProps,
    UndeleteMomentProps,
    HideMomentProps,
    UnhideMomentProps
} from "./types"
import { InternalServerError, UnauthorizedError} from "../../errors"

import MomentStatistic from '../../models/moments/moment_statistic-model.js'
import UserStatistic from '../../models/user/statistic-model.js'
import Metadata from '../../models/moments/moment_metadata-model.js'
import MomentMidia from '../../models/moments/moment_midia-model.js'
import Moment from '../../models/moments/moment-model.js'
import Like from '../../models/moments/like-model.js'
import View from '../../models/moments/view-model.js'
import Share from '../../models/moments/share-model.js'
import Skip from '../../models/moments/skip-model.js'
import ProfileClick from '../../models/moments/profile_click-model.js'
import Comment from '../../models/comments/comment-model.js'
import CommentStatistic from '../../models/comments/comment_statistics-model.js'
import { Notification } from "../../helpers/notification"
import { Relation } from "../../helpers/relation"
import Memory from '../../models/memories/memory-model.js'
import MemoryMoment from '../../models/memories/memory_moments-model.js'

export async function like_moment({ moment_id, user_id }) {
    try{
        const like_exists = await Like.findOne({where: {user_id}})
        if(like_exists) throw new UnauthorizedError({ message: 'this user has already liked it at the moment' })
        else {
            const moment = await Moment.findOne({where: {id: moment_id}, attributes: ["user_id"]})
            await Like.create({ liked_moment_id: moment_id, user_id })
            await MomentStatistic.increment('total_likes_num', { by: 1, where: { moment_id }})
            await UserStatistic.increment('total_likes_num',{ by: 1, where: { user_id: moment.user_id }})
            await Relation.AutoAdd({
                user_id: user_id,
                related_user_id: moment.user_id,
                weight: 0.1
            })  
            await Notification.AutoSend({ 
                sender_user_id: user_id,
                receiver_user_id: moment.user_id,
                type: 'LIKE-MOMENT',
                content_id: moment.id
            })
            return { message: "moment was successfully liked"}             
        }
  
    } catch(err: any){ throw new InternalServerError({ message: err.message })}
}
export async function unlike_moment({ moment_id, user_id }) {
    try{
        const like_exists = await Like.findOne({where: {user_id}})
        if(!like_exists) throw new UnauthorizedError({ message: 'This user did not like at the moment' })
        await Like.destroy({ where: { liked_moment_id: moment_id, user_id } })
        const momentStatistics = await MomentStatistic.findOne({where: {moment_id}, attributes: ['total_likes_num']})
        if(momentStatistics.total_likes_num < 0) await MomentStatistic.update({total_likes_num: 0}, {where: { moment_id }})
        else if (momentStatistics.total_likes_num > 0) {
            await MomentStatistic.increment('total_likes_num', { by: -1, where: { moment_id }})
            await UserStatistic.increment('total_likes_num',{ by: -1, where: { user_id: user_id }})
        }
        return { message: "moment was successfully unliked"}  
    } catch(err: any) { throw new InternalServerError({ message: err.message })}
}
export async function view_moment({ moment_id, user_id }) {
    try{
        const moment = await Moment.findOne({where: {id: moment_id}, attributes: ["user_id"]})
        await View.create({ viewed_moment_id: moment_id, user_id })
        await MomentStatistic.increment('total_views_num', { by: 1, where: { moment_id }})
        await UserStatistic.increment('total_views_num',{ by: 1, where: { user_id: moment.user_id }})
        return { message: "moment was successfully viewed"}   
    } catch(err: any){ throw new InternalServerError({ message: err.message })}
}
export async function share_moment({ moment_id, user_id }) {
    try{
        await Share.create({ shared_moment_id: moment_id, user_id })
        await MomentStatistic.increment('total_shares_num', { by: 1, where: { moment_id }})
        return { message: "moment was successfully shared"}   
    } catch(err: any){ throw new InternalServerError({ message: err.message })}
}
export async function skip_moment({ moment_id, user_id }) {
    try{
        await Skip.create({ skipped_moment_id: moment_id, user_id })
        await MomentStatistic.increment('total_skips_num', { by: 1, where: { moment_id }})
        return { message: "moment was successfully skipped"}   
    } catch(err: any){ throw new InternalServerError({ message: err.message })}
}
export async function profile_click_moment({ moment_id, user_id }) {
    try{
        await ProfileClick.create({ profile_clicked_moment_id: moment_id, user_id })
        await MomentStatistic.increment('total_profile_clicks_num', { by: 1, where: { moment_id }})
        return { message: "moment was successfully profile clicked"}   
    } catch(err: any){ throw new InternalServerError({ message: err.message })}
}
export async function comment_on_moment({
    moment_id, content, user_id
}: CommentOnMomentProps) {
    try{
        const comment = await Comment.create({
            user_id, moment_id, content, parent_comment_id: null
        })
        await CommentStatistic.create({comment_id: comment.id})
        await MomentStatistic.increment('total_comments_num', { by: 1, where: { moment_id }})
        const moment = await Moment.findOne({where: {id: moment_id}, attributes: ["user_id"]})
        await Notification.AutoSend({   
            sender_user_id: user_id,
            receiver_user_id: moment.user_id,
            type: 'COMMENT-MOMENT',
            content_id: moment.id
        })
        return { message: "comment was successfully created"}
    } catch(err: any){
        throw new InternalServerError({ message: err.message })
    }
}
export async function reply_comment_on_moment({
    moment_id, content, parent_comment_id, user_id
}: ReplyCommentOnMomentProps) {
    try{
        const comment = await Comment.create({
            user_id, moment_id, content, parent_comment_id
        })
        await MomentStatistic.increment('total_comments_num', { by: 1, where: { moment_id }})
        await CommentStatistic.create({comment_id: comment.id})
        await CommentStatistic.increment('total_replies_num',{
            by: 1, where: { comment_id: parent_comment_id }
        })
        return { message: "comment was successfully replied"}
    } catch(err: any){
        throw new InternalServerError({ message: err.message })
    }
}
export async function like_comment({ comment_id }:LikeCommentProps) {
    await CommentStatistic.increment('total_likes_num',{ by: 1, where: { comment_id }})
    
    return { message: "comment was successfully liked"}
}
export async function unlike_comment({ comment_id }:UnlikeCommentProps) {
    const comment_statistic = await CommentStatistic.findOne({where: {comment_id}, attributes: ["total_likes_num"]})
    if(comment_statistic.total_likes_num <= 0){
        throw new InternalServerError({
            message: "You can't unlike a comment without likes"
        })
    }
    await CommentStatistic.increment('total_likes_num',{ by: -1, where: { comment_id }})
    return { message: "comment was successfully liked" }
}
export async function hide_moment({moment_id}: HideMomentProps) {
    try{
        await Moment.update({ visible: false }, {where:{id:moment_id}})
        return { message: 'success in hide moment'}        
    } catch(err: any){
        console.log(err.message)
    }
}
export async function unhide_moment({moment_id}: UnhideMomentProps) {
    await Moment.update({ visible: true }, {where:{id:moment_id}})
    return { message: 'success in unhide moment'}
}
export async function delete_moment({moment_id, user_id}: DeleteMomentProps) {  
    const moment = await Moment.findOne({ where: {id: moment_id, user_id}, attributes: ['id', 'deleted']})
    if(!moment) throw new UnauthorizedError({
        message: 'This user is not the owner of this moment',
        action: 'Make sure this user owns the moment to delete it'
    })
    else {
        if(moment.deleted) throw new UnauthorizedError({
            message: 'This moment has already been previously deleted',
            action: 'Make sure this moment has not be deleted previously'
        })
        else {
            await Moment.update({ deleted: true }, {where:{id:moment_id}})
            const memory_moments = await MemoryMoment.findAll({ where: {moment_id}, attributes: ['moment_id', 'memory_id'] })
            return await Promise.all( memory_moments.map(async(memory_moment) => {
                const memory = await Memory.findOne({ where: {id: memory_moment.memory_id}, attributes: ['id'] })
                const memory_moments = await MemoryMoment.findAll({ where: {memory_id: memory.id}, attributes: ['moment_id', 'memory_id'] })
                const memory_moments_list = await Promise.all( memory_moments.map(async (memory_moment_in_list) => {
                    return await Moment.findOne({ where: {id: memory_moment_in_list.moment_id}, attributes: ['id', 'deleted'] })            
                }))
                const filtered_memory_moments_list = memory_moments_list.filter(item => !item.deleted)
                if(filtered_memory_moments_list.length == 0) Memory.destroy({ where: {id: memory.id}})
                await MemoryMoment.destroy({ where: {moment_id} })
                return { message: 'moment have been successfully deleted from memory and associated memory_moment has been deleted' }
            }))        
        }        
    }


}

export async function delete_moment_list ({moment_ids_list}: {moment_ids_list: number[]}) {
    await Promise.all(moment_ids_list.map(async (id) => {
        await Moment.update({ deleted: true, visible: false }, {where:{id}})
    }))
    
    return { message: `moments deleted successfully`}
}
export async function undelete_moment({moment_id}: UndeleteMomentProps) {
    await Moment.update({ deleted: false, visible: true }, {where:{id:moment_id}})
    return { message: 'moment undeleted successfully'}
}