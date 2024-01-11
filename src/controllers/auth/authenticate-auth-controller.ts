import { Request, Response } from 'express'
import { ValidationError, InternalServerError} from '../../errors/index.js'
import { DecriptPassword } from '../../helpers/encrypt-decrypt-password.js'
import { jwtEncoder } from '../../jwt/encode.js'
import { FindUserAlreadyExists } from '../../helpers/find-user-already-exists.js'
import { json } from 'body-parser'

const User = require('../../models/user/user-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')
const Statistic = require('../../models/user/statistic-model.js')

export async function authenticate_user(req: Request, res: Response) {
    const {username, password} = req.body

    console.log(username, password)

    if (await FindUserAlreadyExists({username: username}) === false){
        res.send( new ValidationError({
            message: 'this username cannot exists',
            statusCode: 200
        }))
    } else {
        
        const user = await User.findOne({
            where: { username: username }
        })
        
        if(!await DecriptPassword({password1: password, password2: user.encrypted_password})){
            res.send( new ValidationError({
                message: 'this password is wrong',
                statusCode: 200
            }))
        } else {
            const statistic = await Statistic.findOne({
                attributes: ['total_followers_num', 'total_likes_num', 'total_views_num'],
                where: {user_id: user.id}
            })
            const profile_picture = await ProfilePicture.findOne({
                attributes: ['fullhd_resolution', 'tiny_resolution'],
                where: {user_id: user.id}
            })

            const newAccessToken = await jwtEncoder({ username: user.username, user_id: user.id})

            return res.status(200).json({
                id: user.id,
                username: user.username,
                access_level: user.access_level,
                verifyed: user.verifyed,
                deleted: user.deleted,
                blocked: user.blocked,
                muted: user.muted,
                send_notification_emails: user.send_notification_emails,
                name: null,
                description: null,
                profile_picture: {
                    fullhd_resolution: profile_picture.fullhd_resolution,
                    tiny_resolution: profile_picture.tiny_resolution
                },
                statistics: {
                    total_followers_num:statistic.total_followers_num,
                    total_likes_num: statistic.total_likes_num,
                    total_views_num:statistic.total_views_num
                },
                access_token: newAccessToken
            })
        }


    }
}

export async function refresh_token(req: Request, res: Response) {
    const {username, id} = req.body
    try{
        const newAccessToken = await jwtEncoder({ username: username, user_id: id})
        res.status(200).json({ access_token: newAccessToken })
    } catch(err) {
        res.status(400).send( new ValidationError({
            message: 'the username or id is missing',
        }))
    }

}