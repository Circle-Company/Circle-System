import { ValidationError } from "../../errors"
import Preference from "../../models/preferences/preference-model.js"

export async function get_user_preferences(req: any, res: any) {
    const { user_id } = req.params
    try {
        const preferences = await Preference.findOne({
            where: { user_id },
            attributes: { exclude: ["user_id", "createdAt", "updatedAt", "id"] },
        })
        res.status(200).json(preferences)
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to get user preferences",
                action: "check if the user ID is passed correctly",
            })
        )
    }
}
