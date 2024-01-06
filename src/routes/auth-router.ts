import { Router } from 'express'
import { AuthController } from "../controllers/auth"
import { RoutesPrefix } from '../config/routes_prefix'
import { store_new_user } from '../controllers/auth/store-auth-controller'
const { authenticate_user } = require('../controllers/auth/authenticate-auth-controller')

const authRouter = Router()
authRouter.post( RoutesPrefix.AUTH + '/signup', AuthController.StoreNewUser)
authRouter.post( RoutesPrefix.AUTH + '/signin', AuthController.AuthenticateUser)
module.exports = authRouter
