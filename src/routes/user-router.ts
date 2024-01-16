import { Router } from 'express'
import { UserController } from '../controllers/user'
import { UserAuthenticationValidator } from '../middlewares/UserAuthenticationValidator'
import { RP } from '../config/routes_prefix'

const userRouter = Router()
const USER_PREFIX = RP.API_VERISON + RP.USER
const USER_PROFILE_PREFIX = USER_PREFIX + RP.PROFILE

//userRouter.use(UserAuthenticationValidator)
userRouter.post(USER_PROFILE_PREFIX + '/:username', UserController.FindUserByUsername)
userRouter.post(USER_PROFILE_PREFIX + '/data/:username', UserController.FindUserData)

userRouter.post(USER_PREFIX + '/search', UserController.SearchUser)
userRouter.post(USER_PREFIX + '/recommendations', UserController.RecommenderUsers)

userRouter.post(USER_PREFIX + '/block', UserController.BlockUser)
userRouter.post(USER_PREFIX + '/unlock', UserController.UnlockUser)
userRouter.post(USER_PREFIX + '/follow', UserController.FollowUser)
userRouter.post(USER_PREFIX + '/unfollow', UserController.UnfollowUser)
userRouter.post(USER_PREFIX + '/report', UserController.Report)

module.exports = userRouter