import { ControllersReciveDataProps } from '../controllers-types'
import { FindUserAlreadyExists } from '../../helpers/find-user-already-exists'
import { ContainSpecialCharacters } from '../../helpers/contain-special-characters'
import { ValidationError, InternalServerError} from '../../errors'
import { EncriptedPassword } from '../../helpers/encrypt-decrypt-password'
import { jwtEncoder } from '../../jwt/encode'

const User = require('../../models/user/user-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')
const Statistic = require('../../models/user/statistic-model.js')

export async function store_new_user (req: any, res: any) {
    const {username, password} = req.body

    if (username.length < 4 && username.length > 20){
        res.send( new ValidationError({
            message: 'Your username must contain 4 to 20 characters',
            statusCode: 200
        }))
    }if (await ContainSpecialCharacters({text: username})) {
        res.send( new ValidationError({
            message: "your username can only contain '_' and '.' as special characters",
            statusCode: 200,
        }))
    }if (await FindUserAlreadyExists({username})){
        res.send( new ValidationError({
            message: 'this username already exists',
            statusCode: 200
        }))
    }if (password.length < 4){
        res.send( new ValidationError({
            message: 'your password must contain at least 4 characters'
        }))
    } else {
        const encryptedPassword = await EncriptedPassword({ password })

        try {
            const newUser = await User.create({
                username: username,
                encrypted_password: encryptedPassword,
                access_level: 'user',
                verifyed: false,
                deleted: false,
                blocked: false,
                muted: false,
                terms_and_conditions_agreed_version: '1.0.0',
                terms_and_conditions_agreed_at: Date.now(),
                last_active_at: Date.now(),
                send_notification_emails: false
            })

            await ProfilePicture.create({
                user_id: newUser.id,
            })
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

            return res.status(200).json({
                id: newUser.id,
                username: newUser.username,
                access_level: newUser.access_level,
                verifyed: newUser.verifyed,
                deleted: newUser.deleted,
                blocked: newUser.blocked,
                muted: newUser.muted,
                send_notification_emails: newUser.send_notification_emails,
                name: null,
                description: null,
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
            })

        } catch(err: any) {
            res.send(
                new InternalServerError({message: err.message})
            )
        }

        
        
    }
}