import { find_user_notifications } from "./notification-find-controller";
import { storeToken } from "./notification-store-controller";

export const NotificationController = {
  FinduserNotifications: find_user_notifications,
  StoreToken: storeToken,
};
