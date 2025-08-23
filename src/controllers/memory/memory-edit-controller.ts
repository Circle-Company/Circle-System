import {Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Memory } from '../../services/memory-service'

export async function edit_memory_title(req: Request, res: Response) {
    const { memory_id, user_id, title} = req.body
    const result = await Memory.Edit.Title({memory_id, user_id, title})
    res.status(StatusCodes.ACCEPTED).json(result)
}