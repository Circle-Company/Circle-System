import { Request, Response } from "express"
import NotificationToken from "../../models/notification/notification_token-model.js"

export async function storeToken(req: Request, res: Response) {
    const { token } = req.body
    // @ts-ignore
    const userHasToken = await NotificationToken.findOne({
        where: { user_id: req.user_id },
    })

    if (userHasToken)
        // @ts-ignore
        await NotificationToken.update(
            { token },
            {
                where: { user_id: req.user_id },
            }
        )
    else {
        // @ts-ignore
        await NotificationToken.create({
            user_id: req.user_id,
            token,
        })
    }

    res.status(200).json({ messge: "token created with succesfull" })
}
