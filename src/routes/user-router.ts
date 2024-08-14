import { Router } from "express"
import { RP } from "../config/routes_prefix"
import { UserController } from "../controllers/user"

const userRouter = Router()
const USER_PREFIX = RP.API_VERISON + RP.USER
const USER_PROFILE_PREFIX = USER_PREFIX + RP.PROFILE

//userRouter.use(UserAuthenticationValidator)
userRouter.post(USER_PROFILE_PREFIX + "/:username", UserController.FindUserByUsername)
userRouter.post(USER_PROFILE_PREFIX + "/data/username/:username", UserController.FindUserData)
userRouter.post(USER_PROFILE_PREFIX + "/data/pk/:user_pk", UserController.FindUserByPk)
userRouter.post(USER_PREFIX + "/session/data/pk/:user_pk", UserController.FindSessionUserByPk)
userRouter.post(
    USER_PREFIX + "/session/statistics/pk/:user_pk",
    UserController.FindSessionUserStatisticsByPk
)

userRouter.post(USER_PREFIX + "/search", UserController.SearchUser)
userRouter.post(USER_PREFIX + "/recommendations", UserController.RecommenderUsers)
userRouter.post(USER_PREFIX + "/location/update", UserController.UpdateUserCoordinates)
userRouter.get(USER_PREFIX + "/most-famous", UserController.FindMostFollowedUsers)

userRouter.post(USER_PREFIX + "/block", UserController.BlockUser)
userRouter.post(USER_PREFIX + "/unlock", UserController.UnlockUser)
userRouter.post(USER_PREFIX + "/follow", UserController.FollowUser)
userRouter.post(USER_PREFIX + "/unfollow", UserController.UnfollowUser)
userRouter.post(USER_PREFIX + "/report", UserController.Report)

module.exports = userRouter
