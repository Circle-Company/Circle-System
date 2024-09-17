import { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import { ValidationError } from "sequelize"
import { UnauthorizedError } from "../../errors"
import { MomentService } from "../../services/moment-service"

export async function view_moment(req: Request, res: Response) {
    const result = await MomentService.Actions.View({
        user_id: req.user_id,
        moment_id: req.params.id,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function like_moment(req: Request, res: Response) {
    const result = await MomentService.Actions.Like({
        user_id: req.user_id,
        moment_id: req.params.id,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function unlike_moment(req: Request, res: Response) {
    const result = await MomentService.Actions.Unlike({
        user_id: req.user_id,
        moment_id: req.params.id,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function comment_on_moment(req: Request, res: Response) {
    const result = await MomentService.Actions.CommentOnMoment({
        user_id: Number(req.user_id),
        moment_id: Number(req.params.id),
        content: req.body.content,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function reply_comment_on_moment(req: Request, res: Response) {
    const { user_id, moment_id, parent_comment_id, content } = req.body
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const result = await MomentService.Actions.ReplyCommentOnMoment({
        user_id,
        moment_id,
        parent_comment_id,
        content,
        page,
        pageSize,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function like_comment(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        const result = await MomentService.Actions.LikeComment({
            comment_id: Number(req.params.id),
            user_id: Number(req.user_id),
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error("Error when liking the comment:", err)

        // Verifica o tipo de erro e retorna a resposta apropriada
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err })
        } else if (err instanceof UnauthorizedError) {
            return res.status(401).json({ error: err })
        } else {
            // Em caso de erro interno inesperado, retorna um status 500
            return res.status(500).json({ error: "An unexpected error occurred." })
        }
    }
}

export async function unlike_comment(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        const result = await MomentService.Actions.UnlikeComment({
            comment_id: Number(req.params.id),
            user_id: Number(req.user_id),
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error("Error when unlike comment:", err)
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

export async function hide_moment(req: Request, res: Response) {
    try {
        const result = await MomentService.Actions.Hide({
            moment_id: Number(req.params.id),
            user_id: Number(req.user_id),
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error("Error trying hide moment:", err)
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

export async function unhide_moment(req: Request, res: Response) {
    try {
        const result = await MomentService.Actions.Unhide({
            moment_id: Number(req.params.id),
            user_id: Number(req.user_id),
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.error("Error trying unhide moment:", err)
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

export async function delete_moment(req: Request, res: Response) {
    try {
        const result = await MomentService.Actions.Delete({
            moment_id: Number(req.params.id),
            user_id: Number(req.user_id),
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

export async function delete_moment_list(req: Request, res: Response) {
    const { moment_ids_list } = req.body
    const result = await MomentService.Actions.DeleteList({
        moment_ids_list,
        user_id: Number(req.user_id),
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function undelete_moment(req: Request, res: Response) {
    const result = await MomentService.Actions.Undelete({
        moment_id: Number(req.params.id),
        user_id: Number(req.user_id),
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}
