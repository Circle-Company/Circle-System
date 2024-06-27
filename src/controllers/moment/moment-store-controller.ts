import {Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes';
import { MomentService } from '../../services/moment-service'

export async function store_new_moment (req: Request, res: Response) {
    const { user_id, moment } = req.body
    const result = await MomentService.Store.NewMoment({user_id, moment})
    res.status(StatusCodes.ACCEPTED).json(result)
}

export async function store_moment_interaction(req: Request, res: Response){
    const { interaction, user_id, moment_id, moment_owner_id} = req.body
    const result = await MomentService.Store.Interaction({interaction, user_id, moment_id, moment_owner_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}