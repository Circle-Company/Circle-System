import { ValidationError } from "../../errors"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists"

const User = require('../../models/user/user-model.js')
const Block = require('../../models/user/block-model.js')
const Follow = require('../../models/user/follow-model.js')
const Statistic = require('../../models/user/statistic-model.js')

export async function block_user (req: any, res: any) {
    const {
        user_id,
        blocked_user_id
    } = req.body

    console.log(user_id, blocked_user_id)

    const find_block_exists = await Block.findOne({
        attributes: ['user_id', 'blocked_user_id'],
        where: { user_id: user_id, blocked_user_id: blocked_user_id }
    })

    if(user_id == blocked_user_id) {
        res.status(400).send( new ValidationError({
            message: 'ta user cannot block themselves',
        }))
    }else if(find_block_exists) {
        res.status(400).send( new ValidationError({
            message: 'this user has already been unlocked',
        }))
    } else {

        try{
            await Block.create({
                user_id: user_id,
                blocked_user_id: blocked_user_id
            })
            res.status(200).json({
                message: 'This user has been successfully blocked'
            })
        } catch{
            res.status(400).send( new ValidationError({
                message: 'Failed to block this user',
                action: 'check if this user has been previously blocked'
            }))
        }

    }



}
export async function unlock_user (req: any, res: any) {
    const {
        user_id,
        blocked_user_id
    } = req.body

    const find_block_exists = await Block.findOne({
        attributes: ['user_id', 'blocked_user_id'],
        where: { user_id: user_id, blocked_user_id: blocked_user_id }
    })

    if(!find_block_exists) {
        res.status(400).send( new ValidationError({
            message: 'this user has already been unlocked',
        }))
    }else {
        try{
            await Block.destroy({
                where: {
                    user_id: user_id,
                    blocked_user_id: blocked_user_id                
                }
            })
            res.status(200).json({
                message: 'Sthe user has been successfully unlocked'
            })

        }catch {
            res.status(400).send( new ValidationError({
                message: 'Failed to unlock this user',
                action: 'check if this user has been previously unlocked'
            }))
        }
    }
}

export async function follow_user (req: any, res: any) {
    const {
        user_id,
        followed_user_id
    } = req.body

    const find_follow_exists = await Follow.findOne({
        attributes: ['user_id', 'followed_user_id'],
        where: { user_id: user_id, followed_user_id: followed_user_id }
    })

    if(user_id == followed_user_id) {
        res.status(400).send( new ValidationError({
            message: 'The users cannot follow themselves',
        }))
    }else if(find_follow_exists) {
        res.status(400).send( new ValidationError({
            message: 'This user has already been followed',
        }))
    } else {
        try{
            await Follow.create({
                user_id: user_id,
                followed_user_id: followed_user_id
            })

            await Statistic.increment('total_followers_num',{
                by: 1,
                where: { user_id: followed_user_id}
            })
            res.status(200).json({
                message: 'This user has been successfully followed'
            })
        } catch{
            res.status(400).send( new ValidationError({
                message: 'Failed to follow this user',
                action: 'check if this user has been previously followed'
            }))
        }
    }
}
export async function unfollow_user (req: any, res: any) {
    const {
        user_id,
        followed_user_id
    } = req.body

    const find_follow_exists = await Follow.findOne({
        attributes: ['user_id', 'followed_user_id'],
        where: { user_id: user_id, followed_user_id: followed_user_id }
    })

    if(user_id == followed_user_id) {
        res.status(400).send( new ValidationError({
            message: 'The users cannot unfollow themselves',
        }))
    }else if(!find_follow_exists) {
        res.status(400).send( new ValidationError({
            message: 'This user has already been unfollowed',
        }))
    } else {
        try{
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
            res.status(200).json({
                message: 'This user has been successfully unfollowed'
            })
        } catch{
            res.status(400).send( new ValidationError({
                message: 'Failed to unfollow this user',
                action: 'check if this user has been previously unfollowed'
            }))
        }
    }
}