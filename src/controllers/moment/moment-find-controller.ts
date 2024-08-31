import { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import { MomentService } from "../../services/moment-service"

export async function find_user_feed_moments(req: Request, res: Response) {
    const result = await MomentService.Find.UserFeedMoments({ interaction_queue: req.body })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_user_moments(req: Request, res: Response) {
    const { user_pk } = req.params
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const result = await MomentService.Find.UserMoments({
        user_id: Number(req.user_id),
        finded_user_pk: Number(user_pk),
        page,
        pageSize,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}
export async function find_user_moments_tiny(req: Request, res: Response) {
    const { user_pk } = req.params
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const result = await MomentService.Find.UserMomentsTiny({
        user_id: Number(req.user_id),
        finded_user_pk: Number(user_pk),
        page,
        pageSize,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_user_moments_tiny_exclude_memory(req: Request, res: Response) {
    const { user_id, memory_id } = req.body
    const result = await MomentService.Find.UserMomentsTinyExcludeMemory({ user_id, memory_id })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_moment_comments(req: Request, res: Response) {
    const { moment_id } = req.body
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const result = await MomentService.Find.MomentComments({ moment_id, pageSize, page })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_moment_statistics_view(req: Request, res: Response) {
    const { moment_id } = req.body
    const result = await MomentService.Find.MomentStatisticsView({ moment_id })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_moment_tags(req: Request, res: Response) {
    const { moment_id } = req.body
    const result = await MomentService.Find.MomentTags({ moment_id })
    res.status(StatusCodes.ACCEPTED).json(result)
}
