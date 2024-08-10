export type NotificationProps =
  | { type: "LIKE-MOMENT"; data: NotificationMoment }
  | { type: "NEW-MEMORY"; data: NotificationMemory }
  | { type: "ADD-TO-MEMORY"; data: NotificationAddMemory }
  | { type: "FOLLOW-USER"; data: NotificationUser }
  | { type: "VIEW-USER"; data: NotificationUser };

export type NotificationType =
  | "LIKE-MOMENT"
  | "NEW-MEMORY"
  | "ADD-TO-MEMORY"
  | "FOLLOW-USER"
  | "VIEW-USER";

type NotificationUser = {
  senderUserId: number;
  receiverUserId: number;
};

type NotificationMoment = {
  senderUserId: number;
  receiverUserId: number;
  momentId: number;
};

type NotificationMemory = {
  senderUserId: number;
  memoryId: number;
};

type NotificationAddMemory = {
  senderUserId: number;
  momentId: number;
};
