import Metadata from "@models/user/metadata-model"
import UserLocationInfo from "@models/user/userlocationinfo-model"
import SecurityToolKit from "security-toolkit"
import { Sequelize } from "sequelize"
import { Username } from "../../classes/username"
import config from "../../config"
import { InternalServerError, ValidationError } from "../../errors"
import { DecryptPassword, EncriptedPassword } from "../../helpers/encrypt-decrypt-password"
import { jwtEncoder } from "../../jwt/encode"
import Preference from "../../models/preference/preference-model"
import Contact from "../../models/user/contact-model.js"
import Coordinate from "../../models/user/coordinate-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model"
import User from "../../models/user/user-model"
import { UserEmbeddingService } from "../../swipe-engine/core/embeddings/UserEmbeddingService"
import { getLogger } from "../../swipe-engine/core/utils/logger"
import { StoreNewUserProps } from "./types"

// Inicializar serviços
const userEmbeddingService = new UserEmbeddingService()
const logger = getLogger("store-actions-service")

export async function store_new_user(data: StoreNewUserProps) {
    const { sign, metadata, contact, location_info: locationInfo } = data

    console.log("Storing new user with data:", data)

    // --- VALIDATION ---
    const validUsername = await new Username(sign.username).validate()
    const passwordResult = new SecurityToolKit().checkersMethods.validatePassword({
        password: sign.password,
        validation: { minChars: 4, maxChars: 20 },
    })

    if (!passwordResult.isValid) throw new ValidationError({ message: passwordResult.message })
    if (validUsername === sign.password) {
        throw new ValidationError({
            message: "The username and password cannot be the same.",
            action: "For your account security, please try another password.",
            key: "store-user-service",
        })
    }

    const sequelize: Sequelize = (User as any).sequelize
    if (!sequelize) throw new InternalServerError({ message: "Database not initialized." })

    try {
        // Use the managed transaction form: commit/rollback handled automatically.
        const newUser = await sequelize.transaction(async (transaction) => {
            // CREATE USER inside transaction
            const encryptedPassword = await EncriptedPassword({ password: sign.password })
            const createdUser = await User.create(
                { username: validUsername, encrypted_password: encryptedPassword },
                { transaction }
            )

            if (!createdUser) {
                throw new InternalServerError({ message: "Failed to create user." })
            }

            const user_id = createdUser.id

            // Prepare creations for associated records (all inside same transaction)
            const creations: Promise<any>[] = [
                ProfilePicture.create({ user_id }, { transaction }),
                Coordinate.create({ user_id }, { transaction }),
                Preference.create({ user_id }, { transaction }),
                Statistic.create({ user_id }, { transaction }),
            ]

            if (contact) creations.push(Contact.create({ user_id, ...contact }, { transaction }))
            if (metadata) creations.push(Metadata.create({ user_id, ...metadata }, { transaction }))
            if (locationInfo)
                creations.push(
                    UserLocationInfo.create({ user_id, ...locationInfo }, { transaction })
                )

            // Run in parallel **inside the same transaction**.
            // If any promise rejects, transaction will be rolled back by Sequelize.
            await Promise.all(creations)

            // return created user so transaction resolves with it
            return createdUser
        }) // end transaction

        // --- GENERATE JWT ---
        const newAccessToken = await jwtEncoder({
            username: newUser.username,
            userId: newUser.id.toString(),
        })

        // --- RETURN SESSION ---

        console.log("New user created successfully:", newUser)
        return {
            session: {
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    name: null,
                    description: null,
                    verifyed: false,
                    profile_picture: { small_resolution: null, tiny_resolution: null },
                },
                statistics: { total_followers_num: 0, total_likes_num: 0, total_views_num: 0 },
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
                    language: { appLanguage: "pt", translationLanguage: "pt" },
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
    } catch (err: any) {
        logger.error("Failed to create user and associated data", err)
        throw new InternalServerError({
            message: "Failed to set up your account. Please try again.",
        })
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
