import { NotificationController } from './../controllers/notification'
import { Router } from 'express'
import { RP } from '../config/routes_prefix'

const notificationRouter = Router()
const NOTIFICATION_PREFIX = RP.API_VERISON + RP.NOTIFICATION

//notificationRouter.use(UserAuthenticationValidator)
notificationRouter.post(NOTIFICATION_PREFIX + '/find', NotificationController.FinduserNotifications)


module.exports = notificationRouter