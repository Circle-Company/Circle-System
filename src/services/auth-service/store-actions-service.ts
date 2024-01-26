import { StoreNewUserProps } from "./types";
import { ValidationError, InternalServerError} from "../../errors";
import { ContainSpecialCharacters } from "../../helpers/contain-special-characters";
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists";
import { EncriptedPassword } from "../../helpers/encrypt-decrypt-password";
import { jwtEncoder } from "../../jwt/encode";
import {getSocketInstance} from '../../config/socket'
import { Notification } from "../../helpers/notification";

const Contact = require('../../models/user/contact-model.js')
const Coordinate = require('../../models/user/coordinate-model.js')
const User = require('../../models/user/user-model.js')
const Statistic = require('../../models/user/statistic-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')

export async function store_new_user({
    username, password
}: StoreNewUserProps) {

    if (username.length < 4 && username.length > 20){
        throw new ValidationError({
            message: 'Your username must contain 4 to 20 characters',
        })
    }else if (username == password) {
        throw new ValidationError({
            message: "ythe username and password cannot be the same",
        })
    }else if (await ContainSpecialCharacters({text: username})) {
        throw new ValidationError({
            message: "your username can only contain '_' and '.' as special characters",
        })
    }else if (await FindUserAlreadyExists({username: username}) === true){
        throw new ValidationError({
            message: 'this username already exists',
        })
    }else if (password.length < 4){
        throw new ValidationError({
            message: 'your password must contain at least 4 characters'
        })
    } else {
        const encryptedPassword = await EncriptedPassword({ password })
            const newUser = await User.create({
                username: username,
                encrypted_password: encryptedPassword,
                access_level: 0,
                verifyed: false,
                deleted: false,
                blocked: false,
                muted: false,
                terms_and_conditions_agreed_version: '1.0.0',
                terms_and_conditions_agreed_at: Date.now(),
                last_active_at: Date.now(),
                last_login_at: Date.now(),
                last_password_updated_at: Date.now(),
                send_notification_emails: false
            })

            await ProfilePicture.create({ user_id: newUser.id })
            await Coordinate.create({ user_id: newUser.id })
            await Contact.create({ user_id: newUser.id })

            const newStatistic = await Statistic.create({
                user_id: newUser.id,
                total_followers_num: 0,
                total_likes_num: 0,
                total_views_num: 0
            })
            const newAccessToken = await jwtEncoder({
                username: newUser.username,
                user_id: newUser.id
            })
            return {
                id: newUser.id,
                username: newUser.username,
                name: null,
                description: null,
                access_level: newUser.access_level,
                verifyed: newUser.verifyed,
                deleted: newUser.deleted,
                blocked: newUser.blocked,
                muted: newUser.muted,
                last_active_at: newUser.last_active_at,
                last_login_at: newUser.last_login_at,
                last_failed_login_at: newUser.last_failed_login_at,
                last_password_updated_at: newUser.last_password_updated_at,
                send_notification_emails: newUser.send_notification_emails,
                profile_picture: {
                    fullhd_resolution: null,
                    tiny_resolution: null
                },
                statistics: {
                    total_followers_num: newStatistic.total_followers_num,
                    total_likes_num: newStatistic.total_likes_num,
                    total_views_num: newStatistic.total_views_num
                },
                access_token: newAccessToken
            }
    }

}