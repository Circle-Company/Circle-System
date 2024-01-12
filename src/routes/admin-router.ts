import { Router } from 'express'
import { AdminController } from '../controllers/admin'
import { RP } from '../config/routes_prefix'

const adminRouter = Router()

const ADMIN_PREFIX = RP.API_VERISON + RP.ADMIN
const ADMIN_USER_PREFIX = ADMIN_PREFIX + RP.USER
const ADMIN_LIST_PREFIX = ADMIN_PREFIX + RP.LIST

adminRouter.get( ADMIN_LIST_PREFIX + '/blockeds', AdminController.ListBlockedUsers)
adminRouter.get( ADMIN_LIST_PREFIX + '/deleteds', AdminController.ListDeletedUsers)
adminRouter.get( ADMIN_LIST_PREFIX + '/verifyeds', AdminController.ListVerifyedUsers)
adminRouter.get( ADMIN_LIST_PREFIX + '/muteds', AdminController.ListMutedUsers)
adminRouter.get( ADMIN_LIST_PREFIX + '/admins', AdminController.ListAdminUsers)
adminRouter.get( ADMIN_LIST_PREFIX + '/moderators', AdminController.ListModeratorUsers)

adminRouter.post( ADMIN_USER_PREFIX + '/block', AdminController.BlockUser)
adminRouter.post( ADMIN_USER_PREFIX + '/unlock', AdminController.UnlockUser)
adminRouter.post( ADMIN_USER_PREFIX + '/verify', AdminController.VerifyUser)
adminRouter.post( ADMIN_USER_PREFIX + '/unverify', AdminController.UnverifyUser)
adminRouter.post( ADMIN_USER_PREFIX + '/mute', AdminController.MuteUser)
adminRouter.post( ADMIN_USER_PREFIX + '/unmute', AdminController.UnmuteUser)


module.exports = adminRouter