import { Request, Response } from "express"
import { Op } from "sequelize"
import MomentMidia from "../../models/moments/moment_midia-model.js"
import Follow from "../../models/user/follow-model.js"
import Notification from "../../models/user/notification-model.js"
import ProfilePicture from "../../models/user/profilepicture-model.js"
import User from "../../models/user/user-model.js"

export async function find_user_notifications(req: Request, res: Response) {
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10
    const offset = (page - 1) * pageSize

    // Calculate the date for the last 15 days
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

    try {
        const { count, rows: notifications } = await Notification.findAndCountAll({
            where: {
                receiver_user_id: req.user_id,
                created_at: {
                    [Op.gte]: fifteenDaysAgo, // Filter notifications created in the last 15 days
                },
            },
            limit: pageSize,
            order: [["created_at", "DESC"]],
            offset,
        })

        const arr = await Promise.all(
            notifications.map(async (n: any) => {
                const user = await User.findOne({
                    attributes: ["id", "username", "verifyed"],
                    where: { id: n.sender_user_id },
                    include: [
                        {
                            model: ProfilePicture,
                            as: "profile_pictures",
                            attributes: ["tiny_resolution"],
                        },
                    ],
                })

                const user_followed = await Follow.findOne({
                    attributes: ["followed_user_id", "user_id"],
                    where: { followed_user_id: user.id, user_id: req.user_id },
                })

                if (n.moment_id) {
                    const moment_midia = await MomentMidia.findOne({
                        where: { moment_id: n.moment_id },
                        attributes: ["nhd_resolution"],
                    })

                    return {
                        id: n.id,
                        receiver_user_id: n.receiver_user_id,
                        viewed: n.viewed,
                        type: n.type,
                        created_at: n.createdAt,
                        sender_user: {
                            id: user.id,
                            username: user.username,
                            verifyed: user.verifyed,
                            profile_picture: user.profile_pictures,
                        },
                        midia: moment_midia,
                        you_follow: Boolean(user_followed),
                    }
                } else {
                    return {
                        id: n.id,
                        receiver_user_id: n.receiver_user_id,
                        viewed: n.viewed,
                        type: n.type,
                        created_at: n.createdAt,
                        sender_user: {
                            id: user.id,
                            username: user.username,
                            verifyed: user.verifyed,
                            profile_picture: user.profile_pictures,
                        },
                        you_follow: Boolean(user_followed),
                    }
                }
            })
        )

        const totalPages = Math.ceil(count / pageSize)
        const json = {
            notifications: arr,
            count,
            totalPages,
            currentPage: page,
            pageSize,
        }
        res.status(200).json(json)
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error })
    }
}
