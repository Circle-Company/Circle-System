import { Request, Response } from "express";
import NotificationToken from "../../models/notification/notification_token-model.js";

export async function storeToken(req: Request, res: Response) {
  const { userId, token } = req.body;
  const userHasToken = await NotificationToken.findOne({
    where: { user_id: userId },
  });

  if (userHasToken)
    await NotificationToken.update(
      { token },
      {
        where: { user_id: userId },
      }
    );
  else
    await NotificationToken.create({
      user_id: userId,
      token,
    });

  res.status(200).json({ messge: "token created with succesfull" });
}
