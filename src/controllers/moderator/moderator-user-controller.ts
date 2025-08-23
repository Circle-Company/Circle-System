import { Request, Response } from "express"
import { InternalServerError, ValidationError } from "../../errors"
import User from "../../models/user/user-model"

export async function delete_user(req: Request, res: Response) {
    const { user_id } = req.body

    const user = await User.findOne({
        attributes: ["deleted", "id"],
        where: { id: user_id },
    })
    if (!user) throw new InternalServerError({ message: "Can't possible find this user." })

    if (user.deleted == true) {
        res.status(400).send(
            new ValidationError({
                message: "This user has been deleted previously",
                action: "Make sure the user you want to delete is undeleted",
            })
        )
    } else {
        await User.update(
            { deleted: true },
            {
                where: { id: user.id },
            }
        )
        res.status(200).json({
            message: "This user has been deleted successfully",
        })
    }
}
export async function undelete_user(req: Request, res: Response) {
    const { user_id } = req.body

    const user = await User.findOne({
        attributes: ["deleted", "id"],
        where: { id: user_id },
    })

    if (!user) throw new InternalServerError({ message: "Can't possible find this user." })

    if (user.deleted == false) {
        res.status(400).send(
            new ValidationError({
                message: "This user has not been deleted previusly",
                action: "Make sure the user you want to undelete has been deleted previously",
            })
        )
    } else {
        await User.update(
            { deleted: false },
            {
                where: { id: user.id },
            }
        )
        res.status(200).json({
            message: "This user has been undeleted successfully",
        })
    }
}
