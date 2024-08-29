import { Router } from "express"
import { RP } from "../config/routes_prefix"
import { AdminController } from "../controllers/admin"

export const router = Router()

const ADMIN_USER_PREFIX = RP.USER
const ADMIN_LIST_PREFIX = RP.LIST

router.get(ADMIN_LIST_PREFIX + "/blockeds", AdminController.ListBlockedUsers)
router.get(ADMIN_LIST_PREFIX + "/deleteds", AdminController.ListDeletedUsers)
router.get(ADMIN_LIST_PREFIX + "/verifyeds", AdminController.ListVerifyedUsers)
router.get(ADMIN_LIST_PREFIX + "/muteds", AdminController.ListMutedUsers)
router.get(ADMIN_LIST_PREFIX + "/admins", AdminController.ListAdminUsers)
router.get(ADMIN_LIST_PREFIX + "/moderators", AdminController.ListModeratorUsers)

router.post(ADMIN_USER_PREFIX + "/block", AdminController.BlockUser)
router.post(ADMIN_USER_PREFIX + "/unlock", AdminController.UnlockUser)
router.post(ADMIN_USER_PREFIX + "/verify", AdminController.VerifyUser)
router.post(ADMIN_USER_PREFIX + "/unverify", AdminController.UnverifyUser)
router.post(ADMIN_USER_PREFIX + "/mute", AdminController.MuteUser)
router.post(ADMIN_USER_PREFIX + "/unmute", AdminController.UnmuteUser)
