import { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import { InternalServerError } from "../../errors"
import { Memory } from "../../services/memory-service"

export async function find_memory_moments(req: Request, res: Response) {
    const { memory_id } = req.body
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10

    if (!req.user_id) throw new InternalServerError({ message: "req.user_id is missing." })
    const result = await Memory.Find.Moments({
        user_id: BigInt(req.user_id),
        memory_id,
        page,
        pageSize,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_memory_moments_ids(req: Request, res: Response) {
    const { memory_id } = req.body
    const result = await Memory.Find.MomentsIds({ memory_id })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_memory(req: Request, res: Response) {
    const { memory_id } = req.body
    const result = await Memory.Find.Memory({ memory_id })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_user_memories(req: Request, res: Response) {
    const { user_id } = req.body
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const result = await Memory.Find.UserMemories({ user_id, page, pageSize })
    res.status(StatusCodes.ACCEPTED).json(result)
}
