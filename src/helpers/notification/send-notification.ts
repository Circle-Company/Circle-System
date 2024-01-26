import { SendNotificationProps } from "./types"
import  { getSocketInstance } from '../../config/socket'
const Socket = require('../../models/user/socket-model.js')
const Notification = require('../../models/user/notification-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')
const User = require('../../models/user/user-model.js')
const Follow = require('../../models/user/follow-model.js')

export async function send_notification({
    notification
}: SendNotificationProps) {
    const io = getSocketInstance()

    const socket = await Socket.findOne({ where: {user_id: notification.receiver_user_id}})
    const user = await User.findOne({
        attributes: ['id', 'username', 'verifyed'],
        where: {id: notification.sender_user_id},
        include: [
            {
                model: ProfilePicture,
                as: 'profile_pictures',
                attributes: ['tiny_resolution'],
            },
        ],
    })

    const user_followed = await Follow.findOne({
        attributes: ['followed_user_id', 'user_id'],
        where: { followed_user_id: user.id, user_id: notification.receiver_user_id}
    })
    io.to(socket.socket_id.toString()).emit(`new-notification`, {
        id: notification.id,
        receiver_user_id: notification.receiver_user_id,
        viewed: notification.viewed,
        type: notification.type,
        created_at: notification.created_at,
        sender_user: {
            id: user.id,
            username: user.username,
            verifyed: user.verifyed,
            profile_pictures: user.profile_pictures,
            you_follow:Boolean(user_followed)

        }
    })
    console.log(io)

}