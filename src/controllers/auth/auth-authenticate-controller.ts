import { Request, Response } from "express"
import { ValidationError } from "../../errors/index.js"
import { DecriptPassword } from "../../helpers/encrypt-decrypt-password.js"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists.js"
import { jwtEncoder } from "../../jwt/encode.js"
import NotificationToken from "../../models/notification/notification_token-model"
import Preference from "../../models/preferences/preference-model.js"
import ProfilePicture from "../../models/user/profilepicture-model.js"
import Statistic from "../../models/user/statistic-model.js"
import User from "../../models/user/user-model.js"

export async function authenticate_user(req: Request, res: Response) {
    const { username, password } = req.body

    if ((await FindUserAlreadyExists({ username: username })) === false) {
        throw new ValidationError({ message: "this username cannot exists" })
    } else {
        const user = await User.findOne({
            where: { username: username },
        })

        if (
            !(await DecriptPassword({
                password1: password,
                password2: user.encrypted_password,
            }))
        ) {
            throw new ValidationError({ message: "this password is wrong" })
        } else {
            const statistic = await Statistic.findOne({
                attributes: ["total_followers_num", "total_likes_num", "total_views_num"],
                where: { user_id: user.id },
            })
            const profile_picture = await ProfilePicture.findOne({
                attributes: ["fullhd_resolution", "tiny_resolution"],
                where: { user_id: user.id },
            })

            const notification_token = await NotificationToken.findOne({
                where: { user_id: user.id },
                attributes: ["token"],
            })

            const newAccessToken = await jwtEncoder({
                username: user.username,
                user_id: user.id,
            })

            const userPreferences = await Preference.findOne({ where: { user_id: user.id } })

            console.log(userPreferences)
            return res.status(200).json({
                session: {
                    user: {
                        id: user.id,
                        name: user.name,
                        description: user.description,
                        username: user.username,
                        verifyed: user.verifyed,
                        profile_picture: {
                            small_resolution: profile_picture.fullhd_resolution,
                            tiny_resolution: profile_picture.tiny_resolution,
                        },
                    },
                    statistics: {
                        total_followers_num: statistic.total_followers_num,
                        total_likes_num: statistic.total_likes_num,
                        total_views_num: statistic.total_views_num,
                    },
                    account: {
                        firebasePushToken: notification_token?.token
                            ? notification_token?.token
                            : "",
                        deleted: user.deleted,
                        blocked: user.blocked,
                        muted: user.muted,
                        send_notification_emails: user.send_notification_emails,
                        last_active_at: user.last_active_at,
                        last_login_at: user.last_login_at,
                    },
                    preferences: {
                        language: {
                            appLanguage: userPreferences.app_language,
                            translationLanguage: userPreferences.translation_language,
                        },
                        content: {
                            disableAutoplay: userPreferences.disable_autoplay,
                            disableHaptics: userPreferences.disable_haptics,
                            disableTranslation: userPreferences.disable_translation,
                        },
                        pushNotifications: {
                            disableLikeMoment:
                                userPreferences.disable_like_moment_push_notification,
                            disableNewMemory: userPreferences.disable_new_memory_push_notification,
                            disableAddToMemory:
                                userPreferences.disable_add_to_memory_push_notification,
                            disableFollowUser:
                                userPreferences.disable_follow_user_push_notification,
                            disableViewUser: userPreferences.disable_view_user_push_notification,
                        },
                    },
                },

                access_token: newAccessToken,
            })
        }
    }
}

export async function refresh_token(req: Request, res: Response) {
    const { username, id } = req.body
    try {
        const newAccessToken = await jwtEncoder({
            username: username,
            user_id: id,
        })
        res.status(200).json({ access_token: newAccessToken })
    } catch (err) {
        res.status(400).send(
            new ValidationError({
                message: "the username or id is missing",
            })
        )
    }
}
