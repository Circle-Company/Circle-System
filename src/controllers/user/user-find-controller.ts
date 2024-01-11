import {Request, Response } from 'express'
import { Op } from 'sequelize'
import { ValidationError } from "../../errors"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists"
import { Coordinates, haversineDistance } from '../../helpers/coordinates_distance'
import { SearchEngine } from '../../search_engine'

const User = require('../../models/user/user-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')
const Statistic = require('../../models/user/statistic-model.js')
const Coordinate = require('../../models/user/coordinate-model.js')
const Follow = require('../../models/user/follow-model.js')

export async function find_user_by_username (req: Request, res: Response) {
    const { username }  = req.params

    if(await FindUserAlreadyExists({ username: username }) === false) {
        res.status(400).send( new ValidationError({
            message: 'this username cannot exists',
        }))
    } else {
        const user = await User.findOne({
            where: {username: username}
        })
        const statistic = await Statistic.findOne({
            attributes: ['total_followers_num', 'total_likes_num', 'total_views_num'],
            where: {user_id: user.id}
        })
        const profile_picture = await ProfilePicture.findOne({
            attributes: ['fullhd_resolution', 'tiny_resolution'],
            where: {user_id: user.id}
        })
        
        return res.status(200).json({
            id: user.id,
            username: user.username,
            access_level: user.access_level,
            verifyed: user.verifyed,
            deleted: user.deleted,
            blocked: user.blocked,
            muted: user.muted,
            send_notification_emails: user.send_notification_emails,
            name: user.name,
            description: user.description,
            last_active_at: user.last_active_at,
            profile_picture: {
                fullhd_resolution: profile_picture.fullhd_resolution,
                tiny_resolution: profile_picture.tiny_resolution
            },
            statistics: {
                total_followers_num:statistic.total_followers_num,
                total_likes_num: statistic.total_likes_num,
                total_views_num:statistic.total_views_num
            }
        })
    }
}

export async function find_user_data (req: Request, res: Response) {
    const { username }  = req.params

    if(await FindUserAlreadyExists({ username: username }) === false) {
        res.send( new ValidationError({
            message: 'this username cannot exists',
            statusCode: 200
        }))
    } else {
        const user = await User.findOne({
            where: {username: username}
        })
        const profile_picture = await ProfilePicture.findOne({
            where: {user_id: user.id}
        })
        
        return res.status(200).json({
            id: user.id,
            username: user.username,
            name: user.name,
            description: user.description,
            access_level: user.access_level,
            verifyed: user.verifyed,
            deleted: user.deleted,
            blocked: user.blocked,
            muted: user.muted,
            terms_and_conditions_agreed_version: user.terms_and_conditions_agreed_version,
            terms_and_conditions_agreed_at: user.terms_and_conditions_agreed_at,
            last_active_at: user.last_active_at,
            send_notification_emails: user.send_notification_emails,
            profile_picture: {
                id: profile_picture.id,
                fullhd_resolution: profile_picture.fullhd_resolution,
                tiny_resolution: profile_picture.tiny_resolution,
                created_at: profile_picture.createdAt,
                updated_at: profile_picture.updatedAt
            }
        })
    }
}

export async function search_user (req: Request, res: Response) {
    const { username_to_search, user_id } = req.body

    const search_result  = await SearchEngine({
        username_to_search: username_to_search,
        user_id: user_id
    })

    res.status(200).json(search_result)
}