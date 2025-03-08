import config from "../../config"
import { InternalServerError, ValidationError } from "../../errors"
import { ContainSpecialCharacters } from "../../helpers/contain-special-characters"
import { DecryptPassword, EncriptedPassword } from "../../helpers/encrypt-decrypt-password"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists"
import { jwtEncoder } from "../../jwt/encode"
import Preference from "../../models/preference/preference-model"
import Contact from "../../models/user/contact-model.js"
import Coordinate from "../../models/user/coordinate-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model"
import User from "../../models/user/user-model"
import { StoreNewUserProps } from "./types"

export async function store_new_user({ username, password }: StoreNewUserProps) {
    if (username.length < 4 && username.length > 20) {
        throw new ValidationError({
            message: "Your username must contain 4 to 20 characters.",
        })
    } else if (username == password) {
        throw new ValidationError({
            message: "The username and password cannot be the same.",
        })
    } else if (await ContainSpecialCharacters({ text: username })) {
        throw new ValidationError({
            message: "Your username can only contain '_' and '.' as special characters.",
        })
    } else if ((await FindUserAlreadyExists({ username: username.toLowerCase() })) === true) {
        throw new ValidationError({
            message: "This username already exists.",
        })
    } else if (password.length < 4) {
        throw new ValidationError({
            message: "Your password must contain at least 4 characters.",
        })
    } else {
        const encryptedPassword = await EncriptedPassword({ password })
        const newUser = await User.create({
            username: username.toLowerCase(),
            old_encrypted_password: null,
            encrypted_password: encryptedPassword,
            access_level: 0,
            name: null,
            verifyed: false,
            deleted: false,
            blocked: false,
            muted: false,
            terms_and_conditions_agreed_version: "1.0.0",
            terms_and_conditions_agreed_at: new Date(),
            last_active_at: new Date(),
            last_login_at: new Date(),
            last_password_updated_at: new Date(),
            send_notification_emails: false,
        })
        if (!newUser)
            throw new InternalServerError({ message: "Can´t possible create a new user." })

        await Promise.all([
            ProfilePicture.create({ user_id: newUser.id }),
            Coordinate.create({ user_id: newUser.id }),
            // @ts-ignore
            Contact.create({ user_id: newUser.id }),
            // @ts-ignore
            Preference.create({
                user_id: newUser.id,
                app_timezone: -3,
                app_language: "pt",
                translation_language: "pt",
            }),
        ])

        const [newStatistic, newAccessToken] = await Promise.all([
            Statistic.create({
                user_id: newUser.id,
                total_followers_num: 0,
                total_likes_num: 0,
                total_views_num: 0,
                total_profile_views_num: 0,
                total_memories_num: 0,
                total_moments_num: 0,
            }),
            jwtEncoder({
                username: newUser.username,
                userId: newUser.id,
            }),
        ])

        return {
            session: {
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    description: newUser.description,
                    username: newUser.username,
                    verifyed: newUser.verifyed,
                    profile_picture: {
                        small_resolution: null,
                        tiny_resolution: null,
                    },
                },
                statistics: {
                    total_followers_num: newStatistic.total_followers_num,
                    total_likes_num: newStatistic.total_likes_num,
                    total_views_num: newStatistic.total_views_num,
                },
                account: {
                    deleted: newUser.deleted,
                    blocked: newUser.blocked,
                    muted: newUser.muted,
                    jwtToken: `Bearer ${newAccessToken}`,
                    unreadNotificationsCount: 0,
                    jwtExpiration: config.JWT_EXPIRES.toString(),
                    send_notification_emails: newUser.send_notification_emails,
                    last_active_at: newUser.last_active_at,
                    last_login_at: newUser.last_login_at,
                },
                preferences: {
                    appTimeZone: -3,
                    language: {
                        appLanguage: "pt",
                        translationLanguage: "pt",
                    },
                    content: {
                        disableAutoplay: false,
                        disableHaptics: false,
                        disableTranslation: false,
                    },
                    pushNotifications: {
                        disableLikeMoment: false,
                        disableNewMemory: false,
                        disableAddToMemory: false,
                        disableFollowUser: false,
                        disableViewUser: false,
                    },
                },
            },
        }
    }
}

export async function change_password({
    password_input,
    user_id,
}: {
    password_input: string
    user_id: number
}) {
    const user = await User.findOne({
        where: { id: user_id },
        attributes: ["encrypted_password", "old_encrypted_password"],
    })
    if (!user) throw new InternalServerError({ message: "Can´t possible find this user." })
    const new_encrypted_password = await EncriptedPassword({ password: password_input })
    if (await DecryptPassword({ password1: password_input, password2: user.encrypted_password })) {
        throw new ValidationError({
            message: "Your new password cannot be the same as your current one",
        })
    } else {
        await User.update(
            {
                encrypted_password: new_encrypted_password,
                old_encrypted_password: user.encrypted_password,
                last_password_updated_at: new Date(),
            },
            { where: { id: user_id } }
        )
    }
}
