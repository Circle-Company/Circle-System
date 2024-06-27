import { Request, Response } from 'express'
import { NotFoundError } from "../../errors"
import User from '../../models/user/user-model.js';
import ProfilePicture from '../../models/user/profilepicture-model.js';


export async function list_blocked_users (req: Request, res: Response) {
    const { page, pageSize } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    try {
        const blockeds_list = await User.findAndCountAll({
            attributes: ['username', 'verifyed', 'name', 'last_active_at'],
            where: {blocked: true},
            include: [
                {
                    model: ProfilePicture,
                    as: 'profile_pictures',
                    attributes: ['tiny_resolution']
                }
            ],
            offset,
            limit: Number(pageSize),
        })
        res.status(200).json(blockeds_list)
    } catch (err) {
        res.status(400).send( new NotFoundError({
            message: 'Unable to list all blocked users',
        }))
    }
}
export async function list_deleted_users (req: Request, res: Response) {
    const { page, pageSize } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    try {
        const deleteds_list = await User.findAndCountAll({
            attributes: ['username', 'verifyed', 'name', 'last_active_at'],
            where: {deleted: true},
            include: [
                {
                    model: ProfilePicture,
                    as: 'profile_pictures',
                    attributes: ['tiny_resolution']
                }
            ],
            offset,
            limit: Number(pageSize),
        })
        res.status(200).json(deleteds_list)
    } catch (err) {
        res.status(400).send( new NotFoundError({
            message: 'Unable to list all deleted users',
        }))
    }
}
export async function list_verifyed_users (req: Request, res: Response) {
    const { page, pageSize } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    try {
        const verifyeds_list = await User.findAndCountAll({
            attributes: ['username', 'verifyed', 'name', 'last_active_at'],
            where: {verifyed: true},
            include: [
                {
                    model: ProfilePicture,
                    as: 'profile_pictures',
                    attributes: ['tiny_resolution']
                }
            ],
            offset,
            limit: Number(pageSize),
        })
        res.status(200).json(verifyeds_list)
    } catch (err) {
        res.status(400).send( new NotFoundError({
            message: 'Unable to list all verifyed users',
        }))
    }
}
export async function list_muted_users (req: Request, res: Response) {
    const { page, pageSize } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    try {
        const muteds_list = await User.findAndCountAll({
            attributes: ['username', 'verifyed', 'name', 'last_active_at'],
            where: {muted: true},
            include: [
                {
                    model: ProfilePicture,
                    as: 'profile_pictures',
                    attributes: ['tiny_resolution']
                }
            ],
            offset,
            limit: Number(pageSize),
        })
        res.status(200).json(muteds_list)
    } catch (err) {
        res.status(400).send( new NotFoundError({
            message: 'Unable to list all muted users',
        }))
    }
}
export async function list_admin_users (req: Request, res: Response) {
    const { page, pageSize } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    try {
        const admins_list = await User.findAndCountAll({
            attributes: ['username', 'verifyed', 'name', 'last_active_at'],
            where: {access_level: 1},
            include: [
                {
                    model: ProfilePicture,
                    as: 'profile_pictures',
                    attributes: ['tiny_resolution']
                }
            ],
            offset,
            limit: Number(pageSize),
        })
        res.status(200).json(admins_list)
    } catch (err) {
        res.status(400).send( new NotFoundError({
            message: 'Unable to list all admin users',
        }))
    }
}
export async function list_moderator_users (req: Request, res: Response) {
    const { page, pageSize } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    try {
        const moderators_list = await User.findAndCountAll({
            attributes: ['username', 'verifyed', 'name', 'last_active_at'],
            where: {access_level: 2},
            include: [
                {
                    model: ProfilePicture,
                    as: 'profile_pictures',
                    attributes: ['tiny_resolution']
                }
            ],
            offset,
            limit: Number(pageSize),
        })
        res.status(200).json(moderators_list)
    } catch (err) {
        res.status(400).send( new NotFoundError({
            message: 'Unable to list all moderators users',
        }))
    }
}