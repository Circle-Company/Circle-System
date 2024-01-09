import { Request, Response } from 'express'
import { FindUserAlreadyExists } from '../../helpers/find-user-already-exists'
import { ContainSpecialCharacters } from '../../helpers/contain-special-characters'
import { ValidationError, InternalServerError} from '../../errors'
import { EncriptedPassword } from '../../helpers/encrypt-decrypt-password'
import { jwtEncoder } from '../../jwt/encode'
import { Twilio } from 'twilio'
import CONFIG from '../../config'
import { isValidPhoneNumber } from '../../helpers/is_valid_phone_number'

const User = require('../../models/user/user-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')
const Statistic = require('../../models/user/statistic-model.js')
const Contact = require('../../models/user/contact-model.js')
const Coordinate = require('../../models/user/coordinate-model.js')
let OTP : number | null

export async function store_new_user (req: Request, res: Response) {
    const { username, password } = req.body

    if (username.length < 4 && username.length > 20){
        res.status(400).send( new ValidationError({
            message: 'Your username must contain 4 to 20 characters',
        }))
    }else if (await ContainSpecialCharacters({text: username})) {
        res.status(400).send( new ValidationError({
            message: "your username can only contain '_' and '.' as special characters",
        }))
    }else if (await FindUserAlreadyExists({username: username}) === true){
        res.status(400).send( new ValidationError({
            message: 'this username already exists',
        }))
    }else if (password.length < 4){
        res.status(400).send( new ValidationError({
            message: 'your password must contain at least 4 characters'
        }))
    } else {
        const encryptedPassword = await EncriptedPassword({ password })

        try {
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

            return res.status(200).json({
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
            })

        } catch(err: any) {
            res.status(500).send(
                new InternalServerError({message: err.message})
            )
        }

        
        
    }
}

export async function send_verification_code (req: Request, res: Response) {
    const {
        phone_number,
        phone_state_prefix,
        phone_country_prefix
    } = req.body

    const twilio = new Twilio(CONFIG.TWILIO_ACCOUNT_SID, CONFIG.TWILIO_AUTH_TOKEN)
    const phoneNumber: string = `+${phone_country_prefix}${phone_state_prefix}${phone_number}`
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString()

    if(isValidPhoneNumber({phoneNumber: phoneNumber}) === false){
        res.send( new ValidationError({
            message: 'your phone number is invalid',
        }))
    } else {
        try {
            if(CONFIG.NODE_ENV === 'production'){
                await twilio.messages.create({
                    messagingServiceSid: CONFIG.TWILIO_MESSAGE_SERVICE_SID,
                    body: `Seu código de verificação para Circle App: ${verificationCode}`,
                    from: CONFIG.TWILIO_PHONE_NUMBER,
                    to: phoneNumber,
                })
                res.status(200).json({ message: 'Verification code sent successfully' });
            } else{
                res.status(200).json({
                    message: `Verification code sent successfully (development version)`,
                    verification_code: verificationCode
                });
            }

            OTP = Number(verificationCode)
           
        } catch (err) {
            res.send( new ValidationError({
                message: String(err),
            }))
            OTP = null
        }
    }
}

export async function verify_code (req: Request, res: Response) {
    const {
        verification_code
    } = req.body

    if(OTP == Number(verification_code)){
        res.status(200).json({ message: 'Your phone was successfully verified' });
        OTP = null
    } else{
        res.send( new ValidationError({
            message: "your verification code is wrong",
            action: "Make sure you did not enter the wrong code"
        }))
    }
}
