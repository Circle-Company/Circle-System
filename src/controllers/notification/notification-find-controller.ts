import {Request, Response } from 'express'
const Notification = require('../../models/user/notification-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')
const User = require('../../models/user/user-model.js')
const Follow = require('../../models/user/follow-model.js')

export async function find_user_notifications (req: Request, res: Response) {
    const { user_id } = req.body

    try{
        const notifications = await Notification.findAll({ where: {receiver_user_id: user_id}})
        const arr = await Promise.all(
            notifications.map(async (n: any) => {
                const user = await User.findOne({
                    attributes: ['id', 'username', 'verifyed'],
                    where: {id: n.sender_user_id},
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
                    where: { followed_user_id: user.id, user_id}
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
                        profile_pictures: user.profile_pictures,
                        you_follow:Boolean(user_followed)

                    }
                }    
        }))


        res.status(200).json(arr)
    }catch {

    }

}