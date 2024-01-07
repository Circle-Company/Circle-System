import { Router } from 'express'
import { UserController } from '../controllers/user'
import { UserAuthenticationValidator } from '../middlewares/UserAuthenticationValidator'
import { RP } from '../config/routes_prefix'

const userRouter = Router()
// userRouter.use(UserAuthenticationValidator)
userRouter.get(RP.PREFIX + RP.USER + '/profile/:username', UserController.FindUserByUsername)
userRouter.get(RP.PREFIX + RP.USER + '/profile/data/:username', UserController.FindUserData)
userRouter.get(RP.PREFIX + RP.USER + '/account/edit/description', UserController.EdituserDescription)
userRouter.get(RP.PREFIX + RP.USER + '/account/delete/description', UserController.FindUserData)

module.exports = userRouter