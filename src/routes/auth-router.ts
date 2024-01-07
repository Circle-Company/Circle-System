import { Router } from 'express'
import { AuthController } from "../controllers/auth"
import { RP } from '../config/routes_prefix'

const authRouter = Router()

const authPrefix = RP.PREFIX + RP.AUTH

authRouter.post( authPrefix + '/signup', AuthController.StoreNewUser)
authRouter.post( authPrefix + '/signin', AuthController.AuthenticateUser)
authRouter.post( authPrefix + '/send-verification-code', AuthController.SendVerificationCode)
authRouter.post( authPrefix + '/verify-code', AuthController.VerifyCode)
module.exports = authRouter
