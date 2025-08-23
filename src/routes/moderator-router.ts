import { Router } from "express"
import { RP } from "../config/routes_prefix"
import { ModeratorController } from "../controllers/moderator"

export const router = Router()
const MODERATOR_USER_PREFIX = RP.USER

router.post(MODERATOR_USER_PREFIX + "/delete", ModeratorController.DeleteUser)
router.post(MODERATOR_USER_PREFIX + "/undelete", ModeratorController.UndeleteUser)
