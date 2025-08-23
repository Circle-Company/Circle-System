import { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import { InternalServerError } from "../../errors"
import { Memory } from "../../services/memory-service"

export async function store_new_memory(req: Request, res: Response) {
    const { user_id, title } = req.body
    const result = await Memory.Store.NewMemory({ user_id, title })

    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function store_new_memory_moment(req: Request, res: Response) {
    const { memory_id, moments_list } = req.body

    if (!req.user_id) throw new InternalServerError({ message: "req.user_id is missing." })
    const result = await Memory.Store.NewMemoryMoment({
        user_id: req.user_id,
        memory_id,
        moments_list,
    })
    res.status(StatusCodes.ACCEPTED).json(result)
}
