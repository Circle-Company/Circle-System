import { Router } from 'express'
import { AuthController } from "../controllers/auth"
import { RP } from '../config/routes_prefix'

const authRouter = Router()

const AUTH_PREFIX = RP.API_VERISON + RP.AUTH

authRouter.post( AUTH_PREFIX + '/sign-up', AuthController.StoreNewUser)
authRouter.post( AUTH_PREFIX + '/sign-in', AuthController.AuthenticateUser)
authRouter.post( AUTH_PREFIX + '/send-verification-code', AuthController.SendVerificationCode)
authRouter.post( AUTH_PREFIX + '/verify-code', AuthController.VerifyCode)
authRouter.post( AUTH_PREFIX + '/refresh-token', AuthController.RefreshToken)
authRouter.post( AUTH_PREFIX + '/send-socket', AuthController.SendSocket)
authRouter.post( AUTH_PREFIX + '/username-already-in-use', AuthController.UsernameAlreadyInUse)
authRouter.put( AUTH_PREFIX + '/change-password', AuthController.ChangePassword)

module.exports = authRouter
