import { getSocketInstance } from "../../config/socket"
import MomentMidia from "../../models/moments/moment_midia-model.js"
import Follow from "../../models/user/follow-model.js"
import ProfilePicture from "../../models/user/profilepicture-model.js"
import Socket from "../../models/user/socket-model.js"
import User from "../../models/user/user-model.js"
import { SendNotificationProps } from "./types"

export async function send_notification({ notification }: SendNotificationProps) {
    const io = getSocketInstance()

    const socket = await Socket.findOne({ where: { user_id: notification.receiver_user_id } })
    const user = await User.findOne({
        attributes: ["id", "username", "verifyed"],
        where: { id: notification.sender_user_id },
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
        where: { followed_user_id: user.id, user_id: notification.receiver_user_id },
    })

    let momentMidia: { nhd_resolution: string } | null = null

    if (
        notification.type == "LIKE-MOMENT" ||
        notification.type == "LIKE-MOMENT-2" ||
        (notification.type == "LIKE-MOMENT-3" && notification.content_id !== null)
    ) {
        momentMidia = await MomentMidia.findOne({
            attributes: ["nhd_resolution"],
            where: { moment_id: notification.content_id },
        })
    } else momentMidia = null
    io.to(socket.socket_id.toString()).emit(`new-notification`, {
        id: notification.id,
        receiver_user_id: notification.receiver_user_id,
        viewed: notification.viewed,
        type: notification.type,
        created_at: notification.created_at,
        midia: momentMidia,
        sender_user: {
            id: user.id,
            username: user.username,
            verifyed: user.verifyed,
            profile_picture: user.profile_pictures,
        },
        you_follow: Boolean(user_followed),
    })
    console.log(io)
}
