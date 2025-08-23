import { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import { InternalServerError } from "../../errors"
import { AuthService } from "../../services/auth-service"

export async function find_username_already_in_use(req: Request, res: Response) {
    const { username } = req.body
    try {
        const result = await AuthService.Find.UsernameAlreadyInUse({ username })
        res.status(StatusCodes.ACCEPTED).json(result)
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
