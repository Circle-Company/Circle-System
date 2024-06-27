import {Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Memory } from '../../services/memory-service'

export async function delete_memory (req: Request, res: Response) {
    const { memory_id, user_id } = req.body
    const result = await Memory.Delete.Memory({memory_id, user_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function delete_memory_moment ( req: Request, res: Response) {
    const { memory_id, moment_id, user_id} = req.body
    const result = await Memory.Delete.MemoryMoment({memory_id, moment_id, user_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}