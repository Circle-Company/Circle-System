import { Request, Response } from "express"

import NotificationToken from "../../models/notification/notification_token-model"

export async function storeToken(req: Request, res: Response) {
    const { token } = req.body
    const userHasToken = await NotificationToken.findOne({
        where: { user_id: req.user_id },
    })

    if (userHasToken)
        await NotificationToken.update(
            { token },
            {
                where: { user_id: req.user_id },
            }
        )
    else {
        await NotificationToken.create({
            user_id: req.user_id ?? BigInt(0),
            token,
        })
    }

    res.status(200).json({ messge: "token created with succesfull" })
}
