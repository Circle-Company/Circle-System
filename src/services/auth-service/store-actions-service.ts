import { StoreNewUserProps } from "./types";
import { ValidationError, InternalServerError, UnauthorizedError} from "../../errors";
import { ContainSpecialCharacters } from "../../helpers/contain-special-characters";
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists";
import { DecriptPassword, EncriptedPassword } from "../../helpers/encrypt-decrypt-password";
import { jwtEncoder } from "../../jwt/encode";
import User from '../../models/user/user-model.js'
import Coordinate from '../../models/user/coordinate-model.js'
import Statistic from '../../models/user/statistic-model.js'
import ProfilePicture from '../../models/user/profilepicture-model.js'
import Contact from '../../models/user/contact-model.js'

export async function store_new_user({
    username, password
}: StoreNewUserProps) {

    if (username.length < 4 && username.length > 20){
        throw new ValidationError({
            message: 'Your username must contain 4 to 20 characters.',
        })
    }else if (username == password) {
        throw new ValidationError({
            message: "The username and password cannot be the same.",
        })
    }else if (await ContainSpecialCharacters({text: username})) {
        throw new ValidationError({
            message: "Your username can only contain '_' and '.' as special characters.",
        })
    }else if (await FindUserAlreadyExists({username: username}) === true){
        throw new ValidationError({
            message: 'This username already exists.',
        })
    }else if (password.length < 4){
        throw new ValidationError({
            message: 'Your password must contain at least 4 characters.'
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

            console.log(newUser)
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
                            tiny_resolution: null
                        },
                    },
                    statistics: {
                        total_followers_num: newStatistic.total_followers_num,
                        total_likes_num: newStatistic.total_likes_num,
                        total_views_num: newStatistic.total_views_num
                    }, 
                    account: {
                        deleted: newUser.deleted,
                        blocked: newUser.blocked,
                        muted: newUser.muted,
                        send_notification_emails: newUser.send_notification_emails,
                        last_active_at: newUser.last_active_at,
                        last_login_at: newUser.last_login_at,
                    },
                    preferences: {
                        language: {
                            appLanguage: 'en',
                            primaryLanguage: 'en'
                        },
                        content: {
                            disableAutoplay: false,
                            disableHaptics: false,
                            disableTranslation: false,
                            translationLanguage: 'en'
                        }
                    },    
                },
                access_token: newAccessToken
            }
    }
}

export async function change_password({
    password_input, user_id
}: {password_input: string, user_id: number}) {
    const user = await User.findOne({where: {id: user_id}, attributes: ['encrypted_password', 'old_encrypted_password']})
    const new_encrypted_password = await EncriptedPassword({password: password_input})
    if(await DecriptPassword({password1: password_input, password2: user.encrypted_password})){
        throw new ValidationError({message: 'Your new password cannot be the same as your current one'})
    } else {
        await User.update({
            encrypted_password: new_encrypted_password,
            old_encrypted_password: user.encrypted_password,
            last_password_updated_at: new Date() 
        }, {where: {id: user_id}})
    }
}