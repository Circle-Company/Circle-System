import { Router } from 'express'
import { AdminController } from '../controllers/admin'
import { RP } from '../config/routes_prefix'

const adminRouter = Router()

const ADMIN_PREFIX = RP.API_VERISON + RP.ADMIN
const ADMIN_USER_PREFIX = ADMIN_PREFIX + RP.USER

adminRouter.post( ADMIN_USER_PREFIX + '/block', AdminController.BlockUser)
adminRouter.post( ADMIN_USER_PREFIX + '/unlock', AdminController.UnlockUser)

adminRouter.post( ADMIN_USER_PREFIX + '/verify', AdminController.VerifyUser)
adminRouter.post( ADMIN_USER_PREFIX + '/unverify', AdminController.UnverifyUser)

adminRouter.post( ADMIN_USER_PREFIX + '/mute', AdminController.MuteUser)
adminRouter.post( ADMIN_USER_PREFIX + '/unmute', AdminController.UnmuteUser)

adminRouter.post( ADMIN_USER_PREFIX + '/delete', AdminController.DeleteUser)
adminRouter.post( ADMIN_USER_PREFIX + '/undelete', AdminController.UndeleteUser)


module.exports = adminRouter