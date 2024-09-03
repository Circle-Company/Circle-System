import { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import { MomentService } from "../../services/moment-service"

export async function store_new_moment(req: Request, res: Response) {
    const { moment } = req.body
    try {
        const result = await MomentService.Store.NewMoment({ user_id: Number(req.user_id), moment })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.log(err)
    }
}

export async function store_moment_interaction(req: Request, res: Response) {
    try {
        const result = await MomentService.Store.Interaction({
            interaction: req.body,
            user_id: Number(req.user_id),
            moment_id: Number(req.params.id),
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.log(err)
    }
}
