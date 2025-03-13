import { NextFunction, Request, Response } from "express"
import { InternalServerError, ValidationError } from "../../errors"
import { DecryptPassword } from "../../helpers/encrypt-decrypt-password"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists"
import { jwtEncoder } from "../../jwt/encode"

import config from "../../config"
import NotificationToken from "../../models/notification/notification_token-model"
import Preferences from "../../models/preference/preference-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model"
import User from "../../models/user/user-model"

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
        const [statistic, profile_picture, notification_token, preferences] = await Promise.all([
            Statistic.findOne({
                attributes: ["total_followers_num", "total_likes_num", "total_views_num"],
                where: { user_id: user.id.toString() },
            }),
            ProfilePicture.findOne({
                attributes: ["fullhd_resolution", "tiny_resolution"],
                where: { user_id: user.id.toString() },
            }),
            // @ts-ignore
            NotificationToken.findOne({
                where: { user_id: user.id.toString() },
                attributes: ["token"],
            }) as any,
            // @ts-ignore
            Preferences.findOne({ where: { user_id: user.id.toString() } }) as any,
        ])

        // Gera um novo token de acesso JWT
        const newAccessToken = await jwtEncoder({
            username: user.username,
            userId: user.id.toString(),
        })
        if (!newAccessToken) throw new Error("Authoprization token is Missing.")

        // Monta a resposta com todas as informações do usuário
        return res.status(200).json({
            session: {
                user: {
                    id: user.id,
                    name: user.name ? user.name : null,
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
                    jwtToken: `Bearer ${newAccessToken}`,
                    jwtExpiration: config.JWT_EXPIRES.toString(),
                    deleted: user.deleted,
                    blocked: user.blocked,
                    muted: user.muted,
                    unreadNotificationsCount: 0,
                    send_notification_emails: user.send_notification_emails,
                    last_active_at: user.last_active_at,
                    last_login_at: user.last_login_at,
                },
                preferences: {
                    timezone: preferences?.app_timezone,
                    language: {
                        appLanguage: preferences?.app_language || "en",
                        translationLanguage: preferences?.translation_language || "en",
                    },
                    content: {
                        disableAutoplay: preferences?.disable_autoplay || false,
                        disableHaptics: preferences?.disable_haptics || false,
                        disableTranslation: preferences?.disable_translation || false,
                    },
                    pushNotifications: {
                        disableLikeMoment:
                            preferences?.disable_like_moment_push_notification || false,
                        disableNewMemory:
                            preferences?.disable_new_memory_push_notification || false,
                        disableAddToMemory:
                            preferences?.disable_add_to_memory_push_notification || false,
                        disableFollowUser:
                            preferences?.disable_follow_user_push_notification || false,
                        disableViewUser: preferences?.disable_view_user_push_notification || false,
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
        if (!username || !id)
            throw new ValidationError({
                message: "Username and ID are required to refresh the token.",
                statusCode: 400, // Bad Request
            })

        /**
             
        if (!ipAddress)
            throw new ValidationError({
                message: "ipAddress are required to refresh the token.",
                statusCode: 400, // Bad Request
            })
*/
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
