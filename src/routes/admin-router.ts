import { Router } from 'express'
import { AdminController } from '../controllers/admin'
import { RP } from '../config/routes_prefix'

const adminRouter = Router()

const UserPrefix = RP.PREFIX + RP.ADMIN + RP.USER

adminRouter.post( UserPrefix + '/block', AdminController.BlockUser)
adminRouter.post( UserPrefix + '/unlock', AdminController.UnlockUser)

adminRouter.post( UserPrefix + '/verify', AdminController.VerifyUser)
adminRouter.post( UserPrefix + '/unverify', AdminController.UnverifyUser)

adminRouter.post( UserPrefix + '/mute', AdminController.MuteUser)
adminRouter.post( UserPrefix + '/unmute', AdminController.UnmuteUser)

adminRouter.post( UserPrefix + '/delete', AdminController.DeleteUser)
adminRouter.post( UserPrefix + '/undelete', AdminController.UndeleteUser)


module.exports = adminRouter