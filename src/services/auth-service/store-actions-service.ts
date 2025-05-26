import { DecryptPassword, EncriptedPassword } from "../../helpers/encrypt-decrypt-password"
import { InternalServerError, ValidationError } from "../../errors"

import Contact from "../../models/user/contact-model.js"
import Coordinate from "../../models/user/coordinate-model"
import Preference from "../../models/preference/preference-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import SecurityToolKit from "security-toolkit"
import Statistic from "../../models/user/statistic-model"
import { StoreNewUserProps } from "./types"
import User from "../../models/user/user-model"
import { UserEmbeddingService } from "../../swipe-engine/core/embeddings/UserEmbeddingService"
import { Username } from "../../classes/username"
import config from "../../config"
import { getLogger } from "../../swipe-engine/core/utils/logger"
import { jwtEncoder } from "../../jwt/encode"

// Inicializar serviços
const userEmbeddingService = new UserEmbeddingService()
const logger = getLogger("store-actions-service")

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

        try {
            // Criação de todos os registros relacionados em paralelo com tratamento de erros
            const [profilePicture, coordinate, preference, statistic, contact] = await Promise.all([
                ProfilePicture.create({ user_id }).catch((error) => {
                    console.error("Erro ao criar ProfilePicture:", error)
                    throw new InternalServerError({
                        message: "Failed to create user profile preferences.",
                    })
                }),
                Coordinate.create({ user_id }).catch((error) => {
                    console.error("Erro ao criar Coordinate:", error)
                    throw new InternalServerError({
                        message: "Failed to create user coordinates.",
                    })
                }),
                Preference.create({ user_id }).catch((error) => {
                    console.error("Erro ao criar Preference:", error)
                    throw new InternalServerError({
                        message: "Failed to create user preferences.",
                    })
                }),
                Statistic.create({ user_id }).catch((error) => {
                    console.error("Erro ao criar Statistic:", error)
                    throw new InternalServerError({
                        message: "Failed to create user statistics.",
                    })
                }),
                //@ts-ignore
                Contact.create({ user_id: Number(user_id) }).catch((error) => {
                    console.error("Erro ao criar Contact:", error)
                    throw new InternalServerError({ message: "Failed to create user contact." })
                }),
            ])

            // Gerar embedding para o novo usuário
            try {
                logger.info(`Gerando embedding inicial para o usuário ${user_id}`)
                
                // Extrair informações de preferência que possam ser úteis para o perfil inicial
                const initialProfile = {
                    preferredLanguages: ["pt"], // Idioma padrão é português
                    initialInterests: [], // Sem interesses iniciais
                    demographicInfo: {
                        ageRange: "", // Sem faixa etária definida inicialmente
                        location: "" // Sem localização definida inicialmente
                    }
                }
                
                // Usar o método específico para geração de embeddings iniciais
                await userEmbeddingService.generateInitialEmbedding(
                    BigInt(user_id),
                    initialProfile
                )
                
                logger.info(`Embedding inicial gerado com sucesso para o usuário ${user_id}`)
            } catch (embeddingError) {
                // Apenas logar o erro, não interromper o fluxo de criação do usuário
                logger.error(`Erro ao gerar embedding inicial para usuário ${user_id}: ${embeddingError}`)
            }

            console.log(
                `Usuário criado com sucesso. ID: ${user_id}, Preferências criadas: ${
                    preference ? "Sim" : "Não"
                }`
            )
        } catch (error) {
            console.error("Error during user associated data creation:", error)
            // Se falhou em criar os dados associados, excluir usuário para evitar dados inconsistentes
            await User.destroy({ where: { id: user_id } })
            throw new InternalServerError({
                message: "Failed to set up your account. Please try again.",
            })
        }

        const newAccessToken = await jwtEncoder({
            username: newUser.username,
            userId: user_id.toString(),
        })

        const userIdString = user_id.toString()

        return {
            session: {
                user: {
                    id: userIdString,
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
