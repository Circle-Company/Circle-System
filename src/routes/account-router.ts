import { Router } from "express"
import { RP } from "../config/routes_prefix"
import { AccountController } from "../controllers/account"

export const router = Router()
const ACC_EDIT_PREFIX = RP.EDIT
const ACC_DELETE_PREFIX = RP.DELETE

router.put(ACC_EDIT_PREFIX + "/description", AccountController.EdituserDescription)
router.put(ACC_EDIT_PREFIX + "/name", AccountController.EditUserName)
router.put(ACC_EDIT_PREFIX + "/profile-picture", AccountController.EditProfilePicture)
router.put(ACC_EDIT_PREFIX + "/username", AccountController.EditUserUsername)
router.put(ACC_EDIT_PREFIX + "/coordinates", AccountController.EditCoordinates)

router.delete(ACC_DELETE_PREFIX + "/description", AccountController.DeleteUserDescription)
router.delete(ACC_DELETE_PREFIX + "/name", AccountController.DeleteUserName)
router.delete(ACC_DELETE_PREFIX + "/profile-picture", AccountController.DeleteProfilePicture)
