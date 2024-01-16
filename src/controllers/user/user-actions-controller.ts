import { ValidationError } from "../../errors"
import {UserService} from '../../services/user-service'

export async function block_user (req: any, res: any) {
    const { user_id, blocked_user_id } = req.body
    try{
        await UserService.UserActions.BlockUser({user_id, blocked_user_id})
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
export async function unlock_user (req: any, res: any) {
    const { user_id, blocked_user_id } = req.body
        try{
            await UserService.UserActions.UnlockUser({user_id, blocked_user_id})
            res.status(200).json({
                message: 'the user has been successfully unlocked'
            })
        }catch {
            res.status(400).send( new ValidationError({
                message: 'Failed to unlock this user',
                action: 'check if this user has been previously unlocked'
            }))
        }
}

export async function follow_user (req: any, res: any) {
    const { user_id, followed_user_id } = req.body
    try{
        await UserService.UserActions.FollowUser({user_id, followed_user_id})
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
export async function unfollow_user (req: any, res: any) {
    const { user_id, followed_user_id } = req.body
    try{
        await UserService.UserActions.UnfollowUser({user_id, followed_user_id})
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

export async function report (req: any, res: any) {
    const { user_id, reported_content_id, reported_content_type, report_type } = req.body
    try{
        await UserService.UserActions.ReportUser({
            user_id,
            reported_content_id,
            reported_content_type,
            report_type
        })
        res.status(200).json({
            message: `This  ${reported_content_type} has been successfully reported`
        })
    } catch{
        res.status(400).send( new ValidationError({
            message: `Failed to report this ${reported_content_type}`
        }))
    }
}