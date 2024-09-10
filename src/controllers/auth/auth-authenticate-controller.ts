import { NextFunction, Request, Response } from "express"
import { InternalServerError, ValidationError } from "../../errors/index.js"
import { DecryptPassword } from "../../helpers/encrypt-decrypt-password.js"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists.js"
import { jwtEncoder } from "../../jwt/encode.js"

import config from "../../config/index.js"
import NotificationToken from "../../models/notification/notification_token-model"
import Preference from "../../models/preferences/preference-model.js"
import ProfilePicture from "../../models/user/profilepicture-model.js"
import Statistic from "../../models/user/statistic-model.js"
import User from "../../models/user/user-model.js"

export async function authenticate_user(req: Request, res: Response) {
    const { username, password } = req.body

    try {
        // Verifica se o usuário existe
        const userExists = await FindUserAlreadyExists({ username })
        if (!userExists) {
            throw new ValidationError({ message: "This username does not exist" })
        }

        // Busca o usuário no banco de dados
        const user = await User.findOne({ where: { username } })
        if (!user) {
            throw new ValidationError({ message: "User not found" })
        }

        // Verifica se a senha está correta
        const passwordMatches = await DecryptPassword({
            password1: password,
            password2: user.encrypted_password,
        })
        if (!passwordMatches) {
            throw new ValidationError({ message: "Incorrect password" })
        }

        // Busca as informações do usuário relacionadas
        const [statistic, profile_picture, notification_token, userPreferences] = await Promise.all(
            [
                Statistic.findOne({
                    attributes: ["total_followers_num", "total_likes_num", "total_views_num"],
                    where: { user_id: user.id },
                }),
                ProfilePicture.findOne({
                    attributes: ["fullhd_resolution", "tiny_resolution"],
                    where: { user_id: user.id },
                }),
                NotificationToken.findOne({
                    where: { user_id: user.id },
                    attributes: ["token"],
                }),
                Preference.findOne({ where: { user_id: user.id } }),
            ]
        )

        // Gera um novo token de acesso JWT
        const newAccessToken = await jwtEncoder({
            username: user.username,
            userId: user.id,
        })
        if (!newAccessToken) throw new Error("Authoprization token is Missing.")

        // Monta a resposta com todas as informações do usuário
        return res.status(200).json({
            session: {
                user: {
                    id: user.id,
                    name: user.name,
                    description: user.description,
                    username: user.username,
                    verifyed: user.verifyed,
                    profile_picture: {
                        small_resolution: profile_picture?.fullhd_resolution || "",
                        tiny_resolution: profile_picture?.tiny_resolution || "",
                    },
                },
                statistics: {
                    total_followers_num: statistic?.total_followers_num || 0,
                    total_likes_num: statistic?.total_likes_num || 0,
                    total_views_num: statistic?.total_views_num || 0,
                },
                account: {
                    firebasePushToken: notification_token?.token || "",
                    jwtToken: `Bearer ${newAccessToken}`,
                    jwtExpiration: config.JWT_EXPIRES.toString(),
                    deleted: user.deleted,
                    blocked: user.blocked,
                    muted: user.muted,
                    send_notification_emails: user.send_notification_emails,
                    last_active_at: user.last_active_at,
                    last_login_at: user.last_login_at,
                },
                preferences: {
                    language: {
                        appLanguage: userPreferences?.app_language || "en",
                        translationLanguage: userPreferences?.translation_language || "en",
                    },
                    content: {
                        disableAutoplay: userPreferences?.disable_autoplay || false,
                        disableHaptics: userPreferences?.disable_haptics || false,
                        disableTranslation: userPreferences?.disable_translation || false,
                    },
                    pushNotifications: {
                        disableLikeMoment:
                            userPreferences?.disable_like_moment_push_notification || false,
                        disableNewMemory:
                            userPreferences?.disable_new_memory_push_notification || false,
                        disableAddToMemory:
                            userPreferences?.disable_add_to_memory_push_notification || false,
                        disableFollowUser:
                            userPreferences?.disable_follow_user_push_notification || false,
                        disableViewUser:
                            userPreferences?.disable_view_user_push_notification || false,
                    },
                },
            },
        })
    } catch (err: unknown) {
        console.error("Error during user authentication:", err)

        // Verifica o tipo de erro e retorna a resposta apropriada
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message })
        } else {
            // Caso um erro interno inesperado ocorra
            throw new InternalServerError({
                message: "An unexpected error occurred during authentication.",
                action: "Verify that the username and password are correct",
            })
        }
    }
}

export async function refresh_token(req: Request, res: Response, next: NextFunction) {
    const { username, id } = req.body

    try {
        // Verifica se o corpo da requisição possui as informações necessárias
        if (!username || !id) {
            throw new ValidationError({
                message: "Username and ID are required to refresh the token.",
                statusCode: 400, // Bad Request
            })
        }

        // Gera um novo token de acesso
        const newAccessToken = await jwtEncoder({
            username: username,
            userId: id,
        })

        // Retorna o novo token de acesso com status 200
        return res.status(200).json({
            jwtToken: `Bearer ${newAccessToken}`,
            jwtExpires: config.JWT_EXPIRES.toString(),
        })
    } catch (err: unknown) {
        // Verifica se o erro é uma instância de um erro conhecido
        if (err instanceof ValidationError) {
            return res.status(err.statusCode).json(err)
        } else {
            // Em caso de erro interno, retorna um status 500
            throw new InternalServerError({
                message: "An unexpected error occurred while refreshing the token.",
                statusCode: 500,
            })
        }
    }
}
