import { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import { Twilio } from "twilio"
import CONFIG from "../../config"
import { InternalServerError, ValidationError } from "../../errors"
import { isValidPhoneNumber } from "../../helpers/is_valid_phone_number"
import { AuthService } from "../../services/auth-service"
let OTP: number | null

export async function store_new_user(req: Request, res: Response) {
    const { username, password } = req.body

    try {
        const user = await AuthService.Store.NewUser({
            username,
            password,
        })
        return res.status(200).json(user)
    } catch (err: any) {
        if (err instanceof ValidationError) {
            return res.status(400).json({
                message: err.message,
                action: err.action,
                key: err.key,
            })
        }
        return res.status(500).json({
            message: err.message || "An unexpected error occurred",
        })
    }
}

export async function send_verification_code(req: Request, res: Response) {
    const { phone_number, phone_state_prefix, phone_country_prefix } = req.body

    const twilio = new Twilio(CONFIG.TWILIO_ACCOUNT_SID, CONFIG.TWILIO_AUTH_TOKEN)
    const phoneNumber: string = `+${phone_country_prefix}${phone_state_prefix}${phone_number}`
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString()

    if (isValidPhoneNumber({ phoneNumber: phoneNumber }) === false) {
        res.send(
            new ValidationError({
                message: "your phone number is invalid",
            })
        )
    } else {
        try {
            if (CONFIG.NODE_ENV === "production") {
                await twilio.messages.create({
                    messagingServiceSid: CONFIG.TWILIO_MESSAGE_SERVICE_SID,
                    body: `Seu código de verificação para Circle App: ${verificationCode}`,
                    from: CONFIG.TWILIO_PHONE_NUMBER,
                    to: phoneNumber,
                })
                res.status(200).json({ message: "Verification code sent successfully" })
            } else {
                res.status(200).json({
                    message: `Verification code sent successfully (development version)`,
                    verification_code: verificationCode,
                })
            }

            OTP = Number(verificationCode)
        } catch (err) {
            res.send(
                new ValidationError({
                    message: String(err),
                })
            )
            OTP = null
        }
    }
}

export async function verify_code(req: Request, res: Response) {
    const { verification_code } = req.body

    if (OTP == Number(verification_code)) {
        res.status(200).json({ message: "Your phone was successfully verified" })
        OTP = null
    } else {
        res.send(
            new ValidationError({
                message: "your verification code is wrong",
                action: "Make sure you did not enter the wrong code",
            })
        )
    }
}

export async function change_password(req: Request, res: Response) {
    const { password_input, user_id } = req.body
    try {
        await AuthService.Store.ChangePassword({ password_input, user_id })
        return res.status(StatusCodes.NO_CONTENT).send()
    } catch (err: any) {
        if (err instanceof ValidationError) {
            return res.status(err.statusCode || 400).json({
                message: err.message,
                action: err.action,
                key: err.key,
            })
        } else if (err instanceof InternalServerError) {
            return res.status(err.statusCode || 500).json({
                message: err.message,
                action: err.action,
                errorId: err.errorId,
            })
        } else {
            console.error("[auth-store-controller:change_password] Unhandled Error:", err)
            return res.status(500).json({
                message: "An unexpected server error occurred while changing password.",
            })
        }
    }
}
