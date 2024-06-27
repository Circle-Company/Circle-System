import { Request, Response } from 'express'
import { ValidationError, InternalServerError} from '../../errors'
import { Twilio } from 'twilio'
import CONFIG from '../../config'
import { isValidPhoneNumber } from '../../helpers/is_valid_phone_number'
import { AuthService } from '../../services/auth-service'
import Socket from '../../models/user/socket-model.js'
import { StatusCodes } from 'http-status-codes'
let OTP : number | null

export async function store_new_user (req: Request, res: Response) {
    const { username, password } = req.body

    try{
        const user = await AuthService.Store.NewUser({username, password})
        return res.status(200).json(user)
    } catch (err: any) {
        throw new InternalServerError({message: err.message })
    }
}

export async function send_socket(req: Request, res: Response) {
    const { user_id, socket_id } = req.body

    const socket_exists = await Socket.findOne({where: {user_id}})
    if(socket_exists){
        await Socket.update({ socket_id }, {where: {user_id}})
        res.status(200).json({
            message: `socket was updated successfully`,
        });   
    }else {
        await Socket.create({ user_id, socket_id })   
        res.status(200).json({  
            message: `socket was created successfully`,
        });   
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

export async function change_password(req: Request, res: Response){
    const {password_input, user_id} = req.body
    const result = await AuthService.Store.ChangePassword({ password_input, user_id})
    res.status(StatusCodes.ACCEPTED).json(result)
}
