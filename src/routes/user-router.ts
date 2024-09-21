import { Router } from "express"
import { RP } from "../config/routes_prefix"
import { UserController } from "../controllers/user"
import { CheckUserAccountStatus } from "../middlewares/CheckUserAccountStatus"

export const router = Router()
const USER_PROFILE_PREFIX = RP.PROFILE

router.post(USER_PROFILE_PREFIX + "/:username", UserController.FindUserByUsername)
router.get(
    USER_PROFILE_PREFIX + "/data/username/:username",
    CheckUserAccountStatus,
    UserController.FindUserData
)
router.post(USER_PROFILE_PREFIX + "/data/pk/:user_pk", UserController.FindUserByPk)
router.post("/session/data/pk/:user_pk", UserController.FindSessionUserByPk)
router.post("/session/statistics/pk/:user_pk", UserController.FindSessionUserStatisticsByPk)

router.post("/search", UserController.SearchUser)
router.post("/recommendations", UserController.RecommenderUsers)
router.get("/most-famous", UserController.FindMostFollowedUsers)

router.post("/block", UserController.BlockUser)
router.post("/unlock", UserController.UnlockUser)
router.post("/follow", UserController.FollowUser)
router.post("/unfollow", UserController.UnfollowUser)
router.post("/report", UserController.Report)

router.post("/metadata/store", UserController.StoreUserMetadata)
