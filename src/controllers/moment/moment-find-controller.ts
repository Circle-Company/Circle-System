import { InternalServerError, UnauthorizedError, ValidationError } from "../../errors"
import { Request, Response } from "express"

import { MomentService } from "../../services/moment-service"
import { StatusCodes } from "http-status-codes"

export async function find_user_feed_moments(req: Request, res: Response) {
    if (!req.user_id) {
        throw new UnauthorizedError({
            message: "User ID is missing. You must be authenticated to access this resource.",
        })
    }
    const result = await MomentService.Find.UserFeedMoments({
        interaction_queue: req.body,
        user_id: String(req.user_id),
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_user_moments(req: Request, res: Response) {
    const { user_pk } = req.params
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10

    if (!req.user_id) {
        throw new UnauthorizedError({
            message: "User ID is missing. You must be authenticated to access this resource.",
        })
    }

    const result = await MomentService.Find.UserMoments({
        user_id: req.user_id,
        finded_user_pk: BigInt(user_pk),
        page,
        pageSize,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}
export async function find_user_moments_tiny(req: Request, res: Response) {
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    if (!req.user_id) {
        throw new UnauthorizedError({
            message: "User ID is missing. You must be authenticated to access this resource.",
        })
    }
    if (!req.params.user_pk)
        throw new InternalServerError({
            message: "req.params.user_pk is missing.",
            action: "Verify if your request is passing params correctly.",
        })

    const result = await MomentService.Find.UserMomentsTiny({
        user_id: req.user_id,
        finded_user_pk: BigInt(req.params.user_pk),
        page,
        pageSize,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_user_moments_tiny_exclude_memory(req: Request, res: Response) {
    if (!req.user_id) {
        throw new UnauthorizedError({
            message: "User ID is missing. You must be authenticated to access this resource.",
        })
    }
    if (!req.params.id)
        throw new InternalServerError({
            message: "req.params.id is missing.",
            action: "Verify if your request is passing params correctly.",
        })
    const result = await MomentService.Find.UserMomentsTinyExcludeMemory({
        memory_id: BigInt(req.params.id),
        user_id: BigInt(req.user_id),
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_moment_comments(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string, 10) || 1
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10
        const result = await MomentService.Find.MomentComments({
            moment_id: req.params.id,
            user_id: req.user_id,
            pageSize,
            page,
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error(err)
    }
}

export async function find_moment_statistics_view(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        if (!req.params.id)
            throw new InternalServerError({
                message: "req.params.id is missing.",
                action: "Verify if your request is passing params correctly.",
            })
        const result = await MomentService.Find.MomentStatisticsView({
            moment_id: BigInt(req.params.id),
            user_id: req.user_id,
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error("Error trying delete moment:", err)
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message })
        } else if (err instanceof UnauthorizedError) {
            return res.status(401).json({ error: err.message })
        } else {
            // Em caso de erro interno inesperado, retorna um status 500
            return res.status(500).json({ error: "An unexpected error occurred." })
        }
    }
}

export async function find_moment_tags(req: Request, res: Response) {
    if (!req.params.id)
        throw new InternalServerError({
            message: "req.params.id is missing.",
            action: "Verify if your request is passing params correctly.",
        })
    const result = await MomentService.Find.MomentTags({
        moment_id: BigInt(req.params.id),
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}
