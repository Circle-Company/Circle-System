import {Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Memory } from '../../services/memory-service'

export async function find_memory_moments(req: Request, res: Response) {
    const { memory_id } = req.body
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const result = await Memory.Find.Moments({memory_id, page, pageSize})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_memory (req: Request, res: Response) {
    const { memory_id } = req.body
    const result = await Memory.Find.Memory({ memory_id })
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function find_user_memories (req: Request, res: Response) {
    const { user_id } = req.body
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const result = await Memory.Find.UserMemories({user_id, page, pageSize})
    res.status(StatusCodes.ACCEPTED).json(result)
}