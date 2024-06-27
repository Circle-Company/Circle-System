import {Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes';
import { MomentService } from '../../services/moment-service'

export async function view_moment(req: Request, res: Response) {
    const {user_id, moment_id} = req.body
    const result = await MomentService.Actions.View({user_id, moment_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function like_moment(req: Request, res: Response) {
    const {user_id, moment_id} = req.body
    const result = await MomentService.Actions.Like({user_id, moment_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function unlike_moment(req: Request, res: Response) {
    const {user_id, moment_id} = req.body
    const result = await MomentService.Actions.Unlike({user_id, moment_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function comment_on_moment (req: Request, res: Response) {
    const { user_id, moment_id, content} = req.body
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const result = await MomentService.Actions.CommentOnMoment({
        user_id, moment_id, content, page, pageSize
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function reply_comment_on_moment (req: Request, res: Response) {
    const { user_id, moment_id, parent_comment_id, content } = req.body
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const result = await MomentService.Actions.ReplyCommentOnMoment({
        user_id, moment_id, parent_comment_id, content, page,pageSize
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function like_comment (req: Request, res: Response) {
    const { comment_id } = req.body
    const result = await MomentService.Actions.LikeComment({comment_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function unlike_comment (req: Request, res: Response) {
    const { comment_id } = req.body
    const result = await MomentService.Actions.UnlikeComment({comment_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function hide_moment(req: Request, res: Response) {
    const { moment_id } = req.body
    const result = await MomentService.Actions.Hide({moment_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function unhide_moment(req: Request, res: Response) {
    const { moment_id } = req.body
    const result = await MomentService.Actions.Unhide({moment_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function delete_moment(req: Request, res: Response) {
    const { moment_id, user_id } = req.body
    const result = await MomentService.Actions.Delete({moment_id, user_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function delete_moment_list(req: Request, res: Response) {
    const { moment_ids_list } = req.body
    const result = await MomentService.Actions.DeleteList({moment_ids_list})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function undelete_moment(req: Request, res: Response) {
    const { moment_id } = req.body
    const result = await MomentService.Actions.Undelete({moment_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}