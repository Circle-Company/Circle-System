import { Request, Response } from "express"

export async function reportAccount(req: Request, res: Response) {
    const { username, type, details } = req.body

    /**
    @return {
        message: string
        type: success | error
    }
    */
}
