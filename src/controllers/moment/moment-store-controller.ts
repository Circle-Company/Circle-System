import { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import { InternalServerError, UnauthorizedError } from "../../errors"
import { MomentService } from "../../services/moment-service"

export async function store_new_moment(req: Request, res: Response) {
    const { moment } = req.body
    try {
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }
        const result = await MomentService.Store.NewMoment({ user_id: req.user_id, moment })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.log(err)
    }
}

export async function store_moment_interaction(req: Request, res: Response) {
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
        const result = await MomentService.Store.Interaction({
            interaction: req.body,
            user_id: req.user_id,
            moment_id: BigInt(req.params.id),
        })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: unknown) {
        console.log(err)
    }
}
