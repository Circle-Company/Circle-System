import { Router } from 'express'
import { ModeratorController } from '../controllers/moderator'
import { RP } from '../config/routes_prefix'

const moderatorRouter = Router()

const MODERATOR_PREFIX = RP.API_VERISON + RP.MODERATOR
const MODERATOR_USER_PREFIX = MODERATOR_PREFIX + RP.USER

moderatorRouter.use(moderatorRouter)
moderatorRouter.post( MODERATOR_USER_PREFIX + '/delete', ModeratorController.DeleteUser)
moderatorRouter.post( MODERATOR_USER_PREFIX + '/undelete', ModeratorController.UndeleteUser)


module.exports = moderatorRouter