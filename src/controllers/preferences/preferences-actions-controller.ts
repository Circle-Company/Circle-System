import { ValidationError } from "../../errors"
import Preference from "../../models/preference/preference-model"

export async function set_app_language(req: any, res: any) {
    const { user_id, app_language } = req.body
    try {
        // @ts-ignore
        await Preference.update({ app_language }, { where: { user_id: user_id.toString() } })
        res.status(200).json({
            message: "The app language has sucessfully changed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to change app lanuage",
                action: "check if the app language is as string",
            })
        )
    }
}

export async function set_translation_language(req: any, res: any) {
    const { user_id, translation_language } = req.body
    try {
        // @ts-ignore
        await Preference.update(
            { translation_language },
            { where: { user_id: user_id.toString() } }
        )
        res.status(200).json({
            message: "The translation language has sucessfully changed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to change translation lanuage",
                action: "check if the translation language is as string",
            })
        )
    }
}

export async function set_autoplay(req: any, res: any) {
    const { user_id, disable_autoplay } = req.body
    try {
        // @ts-ignore
        await Preference.update({ disable_autoplay }, { where: { user_id: user_id.toString() } })
        res.status(200).json({
            message: "The autoplay has sucessfully changed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to change autoplay",
                action: "check if the autoplay is as boolean",
            })
        )
    }
}

export async function set_haptics(req: any, res: any) {
    const { user_id, disable_haptics } = req.body
    try {
        // @ts-ignore
        await Preference.update({ disable_haptics }, { where: { user_id: user_id.toString() } })
        res.status(200).json({
            message: "The haptics has sucessfully changed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to change haptics",
                action: "check if the haptics is as boolean",
            })
        )
    }
}

export async function set_translation(req: any, res: any) {
    const { user_id, disable_translation } = req.body
    try {
        // @ts-ignore
        await Preference.update({ disable_translation }, { where: { user_id: user_id.toString() } })
        res.status(200).json({
            message: "The translation has sucessfully changed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to change translation",
                action: "check if the translation is as boolean",
            })
        )
    }
}

export async function set_like_moment_push_notification(req: any, res: any) {
    const { user_id, disable_like_moment_push_notification } = req.body
    try {
        // @ts-ignore
        await Preference.update(
            { disable_like_moment_push_notification },
            { where: { user_id: user_id.toString() } }
        )
        res.status(200).json({
            message: "The like moment push notification has sucessfully changed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to change like moment push notification",
                action: "check if the like moment push notification is as boolean",
            })
        )
    }
}

export async function set_new_memory_push_notification(req: any, res: any) {
    const { user_id, disable_new_memory_push_notification } = req.body
    try {
        // @ts-ignore
        await Preference.update(
            { disable_new_memory_push_notification },
            { where: { user_id: user_id.toString() } }
        )
        res.status(200).json({
            message: "The new memory push notification has sucessfully changed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to change new memory push notification",
                action: "check if the new memory push notification is as boolean",
            })
        )
    }
}

export async function set_add_to_memory_push_notification(req: any, res: any) {
    const { user_id, disable_add_to_memory_push_notification } = req.body
    try {
        // @ts-ignore
        await Preference.update(
            { disable_add_to_memory_push_notification },
            { where: { user_id: user_id.toString() } }
        )
        res.status(200).json({
            message: "The add to memory push notification has sucessfully changed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to change add to memory push notification",
                action: "check if the add to memory push notification is as boolean",
            })
        )
    }
}

export async function set_follow_user_push_notification(req: any, res: any) {
    const { user_id, disable_follow_user_push_notification } = req.body
    try {
        // @ts-ignore
        await Preference.update(
            { disable_follow_user_push_notification },
            { where: { user_id: user_id.toString() } }
        )
        res.status(200).json({
            message: "The follow user push notification has sucessfully changed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to change follow user push notification",
                action: "check if the follow user push notification is as boolean",
            })
        )
    }
}

export async function set_view_user_push_notification(req: any, res: any) {
    const { user_id, disable_view_user_push_notification } = req.body
    try {
        // @ts-ignore
        await Preference.update(
            { disable_view_user_push_notification },
            { where: { user_id: user_id.toString() } }
        )
        res.status(200).json({
            message: "The view user push notification has sucessfully changed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to change view user push notification",
                action: "check if the view user push notification is as boolean",
            })
        )
    }
}
