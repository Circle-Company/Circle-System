import { InternalServerError, UnauthorizedError } from "../../errors"
import { Request, Response } from "express"

// Importações para integração Swipe Engine
import { FeedbackProcessor } from "../../swipe-engine/core/feedback/FeedbackProcessor"
import { MomentService } from "../../services/moment-service"
import { PostEmbeddingService } from "../../swipe-engine/core/embeddings/PostEmbeddingService"
import Report from '../../models/user/report-model.js'
import { StatusCodes } from "http-status-codes"
import { UserEmbeddingService } from "../../swipe-engine/core/embeddings/UserEmbeddingService"
import { ValidationError } from "sequelize"
import { getLogger } from "../../swipe-engine/core/utils/logger"

const logger = getLogger("moment-actions-controller")
const userEmbeddingService = new UserEmbeddingService()
const postEmbeddingService = new PostEmbeddingService()
const feedbackProcessor = new FeedbackProcessor(userEmbeddingService, postEmbeddingService, logger)

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
    const result = await MomentService.Actions.CommentOnMoment({
        user_id: req.user_id,
        moment_id: BigInt(req.params.id),
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
        if (!req.params.id)
            throw new InternalServerError({
                message: "req.params.id is missing.",
                action: "Verify if your request is passing params correctly.",
            })
        const result = await MomentService.Actions.LikeComment({
            comment_id: BigInt(req.params.id),
            user_id: req.user_id,
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
        if (!req.params.id)
            throw new InternalServerError({
                message: "req.params.id is missing.",
                action: "Verify if your request is passing params correctly.",
            })
        const result = await MomentService.Actions.UnlikeComment({
            comment_id: BigInt(req.params.id),
            user_id: req.user_id,
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
        const result = await MomentService.Actions.Hide({
            moment_id: BigInt(req.params.id),
            user_id: req.user_id,
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
        const result = await MomentService.Actions.Unhide({
            moment_id: BigInt(req.params.id),
            user_id: req.user_id,
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
        const result = await MomentService.Actions.Delete({
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

export async function delete_moment_list(req: Request, res: Response) {
    const { moment_ids_list } = req.body
    if (!req.user_id) {
        throw new UnauthorizedError({
            message: "User ID is missing. You must be authenticated to access this resource.",
        })
    }
    const result = await MomentService.Actions.DeleteList({
        moment_ids_list,
        user_id: req.user_id,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function undelete_moment(req: Request, res: Response) {
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
    const result = await MomentService.Actions.Undelete({
        moment_id: BigInt(req.params.id),
        user_id: req.user_id,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function report_moment(req: Request, res: Response) {
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
        if (!req.body.report_type) {
            throw new InternalServerError({
                message: "report_type is missing.",
                action: "Informe o tipo de report (ex: SPAM, VIOLENCE, etc)",
            })
        }
        await Report.create({
            user_id: req.user_id,
            reported_content_id: BigInt(req.params.id),
            reported_content_type: 'MOMENT',
            report_type: req.body.report_type
        })
        // Integração Swipe Engine: registrar interação de report
        try {
            await feedbackProcessor.processInteraction({
                id: `${req.user_id}-${req.params.id}-${Date.now()}`,
                userId: BigInt(req.user_id),
                entityId: BigInt(req.params.id),
                entityType: "post",
                type: "report",
                timestamp: new Date(),
                metadata: { report_type: req.body.report_type }
            })
        } catch (feedbackErr) {
            logger.error("Erro ao atualizar embedding (report_moment)", feedbackErr)
        }
        res.status(StatusCodes.ACCEPTED).json({ success: true })
    } catch (err: unknown) {
        console.error("Error when reporting moment:", err)
        res.status(500).json({ error: "Erro ao reportar momento.", message: (err as any).message })
    }
}
