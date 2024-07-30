import { Router } from "express";
import { RP } from "../config/routes_prefix";
import { NotificationController } from "./../controllers/notification";

const notificationRouter = Router();
const NOTIFICATION_PREFIX = RP.API_VERISON + RP.NOTIFICATION;

//notificationRouter.use(UserAuthenticationValidator)
notificationRouter.post(
  NOTIFICATION_PREFIX + "/find",
  NotificationController.FinduserNotifications
);
notificationRouter.post(
  NOTIFICATION_PREFIX + "/token/store",
  NotificationController.StoreToken
);

module.exports = notificationRouter;
