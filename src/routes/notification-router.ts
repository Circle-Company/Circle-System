import { Router } from "express"
import { NotificationController } from "./../controllers/notification"

export const router = Router()
router.get("/find", NotificationController.FinduserNotifications)
router.post("/token/store", NotificationController.StoreToken)
