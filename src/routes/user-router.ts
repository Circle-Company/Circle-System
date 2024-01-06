import { Router } from 'express'
import { UserController } from '../controllers/user'
import { UserAuthenticationValidator } from '../middlewares/UserAuthenticationValidator'
import { RoutesPrefix } from '../config/routes_prefix'

const userRouter = Router()
// userRouter.use(UserAuthenticationValidator)
userRouter.get(RoutesPrefix.USER + 'profile/:username', UserController.FindUserByUsername)
module.exports = userRouter