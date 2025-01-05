import { Request, Response } from "express"
import { ValidationError } from "../../errors"
import ProfilePicture from "../../models/user/profilepicture-model"
import User from "../../models/user/user-model"

export async function delete_user_description(req: Request, res: Response) {
    const { user_id } = req.body
    try {
        await User.update(
            { description: null },
            {
                where: { id: user_id },
            }
        )
        res.status(200).json({
            message: "This user description has been deleted successfully",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "It was not possible to delete the description of this user",
                action: "Make sure the user has a description to be deleted",
            })
        )
    }
}
export async function delete_user_name(req: Request, res: Response) {
    const { user_id } = req.body

    try {
        await User.update(
            { name: null },
            {
                where: { id: user_id },
            }
        )
        res.status(200).json({
            message: "This user name has been deleted successfully",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "It was not possible to delete the name of this user",
                action: "Make sure the user has a name to be deleted",
            })
        )
    }
}
export async function delete_profile_picture(req: Request, res: Response) {
    const { user_id } = req.body

    try {
        ProfilePicture.update(
            {
                fullhd_resolution: null,
                tiny_resolution: null,
            },
            { where: { user_id: user_id } }
        )

        res.status(200).json({
            message: "This user profile picture has been deleted successfully",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "It was not possible to delete the profile picture of this user",
                action: "Make sure the user has a profile picture to be deleted",
            })
        )
    }
}
