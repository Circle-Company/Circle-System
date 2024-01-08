import { Router } from 'express'
import { AuthController } from "../controllers/auth"
import { RP } from '../config/routes_prefix'

const authRouter = Router()

const AUTH_PREFIX = RP.API_VERISON + RP.AUTH

authRouter.post( AUTH_PREFIX + '/signup', AuthController.StoreNewUser)
authRouter.post( AUTH_PREFIX + '/signin', AuthController.AuthenticateUser)
authRouter.post( AUTH_PREFIX + '/send-verification-code', AuthController.SendVerificationCode)
authRouter.post( AUTH_PREFIX + '/verify-code', AuthController.VerifyCode)
module.exports = authRouter
