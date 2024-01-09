import { Router } from 'express'
import { AccountController } from '../controllers/account'
import { UserAuthenticationValidator } from '../middlewares/UserAuthenticationValidator'
import { RP } from '../config/routes_prefix'

const accountRouter = Router()
const ACC_PREFIX = RP.API_VERISON + RP.ACCOUNT
const ACC_EDIT_PREFIX = ACC_PREFIX + RP.EDIT
const ACC_DELETE_PREFIX = ACC_PREFIX + RP.DELETE

// accountRouter.use(UserAuthenticationValidator)
accountRouter.put(ACC_EDIT_PREFIX + '/description', AccountController.EdituserDescription)
accountRouter.put(ACC_EDIT_PREFIX + '/name', AccountController.EditUserName)
accountRouter.put(ACC_EDIT_PREFIX + '/profile-picture', AccountController.EditProfilePicture)
accountRouter.put(ACC_EDIT_PREFIX + '/username', AccountController.EditUserUsername)
accountRouter.put(ACC_EDIT_PREFIX + '/coordinates', AccountController.EditCoordinates)

accountRouter.delete(ACC_DELETE_PREFIX + '/description', AccountController.DeleteUserDescription)
accountRouter.delete(ACC_DELETE_PREFIX + '/name', AccountController.DeleteUserName)
accountRouter.delete(ACC_DELETE_PREFIX + '/profile-picture', AccountController.DeleteProfilePicture)
module.exports = accountRouter