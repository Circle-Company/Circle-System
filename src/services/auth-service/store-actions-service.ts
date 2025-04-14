import { Username } from "classes/username"
import config from "../../config"
import { InternalServerError, ValidationError } from "../../errors"
import { DecryptPassword, EncriptedPassword } from "../../helpers/encrypt-decrypt-password"
import { useUsernameValidator } from "../../helpers/usernameValidator"
import { jwtEncoder } from "../../jwt/encode"
import Preference from "../../models/preference/preference-model"
import Contact from "../../models/user/contact-model.js"
import Coordinate from "../../models/user/coordinate-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model"
import User from "../../models/user/user-model"
import SecurityToolKit from "../../security-tool/src"
import { StoreNewUserProps } from "./types"

export async function store_new_user({ username, password }: StoreNewUserProps) {
    const validUsername = await new Username(username).validate()
    const passwordResult = new SecurityToolKit().checkersMethods.validatePassword({
        password,
        validation: {
            minChars: 4,
            maxChars: 20,
        },
    })

    if (!passwordResult.isValid) throw new ValidationError({ message: passwordResult.message })
    else if (validUsername == password) {
        throw new ValidationError({
            message: "The username and password cannot be the same.",
            action: "For your account securty, please try another password.",
            key: "store-user-service",
        })
    } else {
        const newUser = await User.create({
            username: validUsername,
            encrypted_password: await EncriptedPassword({ password }),
        })
        if (!newUser)
            throw new InternalServerError({
                message: "Can´t possible create a new user.",
            })

        const user_id = newUser.id

        await Promise.all([
            ProfilePicture.create({ user_id }),
            Coordinate.create({ user_id }),
            Preference.create({ user_id }),
            Statistic.create({ user_id }),
            //@ts-ignore
            Contact.create({ user_id: Number(user_id) }),
        ])

        const newAccessToken = await jwtEncoder({
            username: newUser.username,
            userId: newUser.id.toString(),
        })

        return {
            session: {
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    name: null,
                    description: null,
                    verifyed: false,
                    profile_picture: {
                        small_resolution: null,
                        tiny_resolution: null,
                    },
                },
                statistics: {
                    total_followers_num: 0,
                    total_likes_num: 0,
                    total_views_num: 0,
                },
                account: {
                    deleted: false,
                    blocked: false,
                    muted: false,
                    jwtToken: `Bearer ${newAccessToken}`,
                    unreadNotificationsCount: 0,
                    jwtExpiration: config.JWT_EXPIRES.toString(),
                    send_notification_emails: true,
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
