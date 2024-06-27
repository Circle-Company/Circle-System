import { Request, Response } from 'express'
import { ValidationError } from "../../errors"
import User from '../../models/user/user-model.js'

export async function block_user (req: Request, res: Response) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['blocked', 'id'],
        where: {id: user_id}
    })

    if(user.blocked == true){
        res.status(400).send( new ValidationError({
            message: 'This user has been blocked previously',
            action: 'Make sure the user you want to block is unlocked',
        }))
    }else {
        await User.update({ blocked: true }, {
            where: {id: user.id}
        })
        res.status(200).json({
            message: 'This user has been blocked successfully'
        })
    }
}
export async function unlock_user (req: Request, res: Response) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['blocked', 'id'],
        where: {id: user_id}
    })

    if(user.blocked == false){
        res.status(400).send( new ValidationError({
            message: 'This user has not been blocked previusly',
            action: 'Make sure the user you want to unlock has been blocked previously',
        }))
    }else {
        await User.update({ blocked: false }, {
            where: {id: user.id}
        })
        res.status(200).json({
            message: 'This user has been unblocked successfully'
        })
    }
}

export async function verify_user (req: Request, res: Response) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['verifyed', 'id'],
        where: {id: user_id}
    })

    if(user.verifyed == true){
        res.status(400).send( new ValidationError({
            message: 'This user has been verifyed previously',
            action: 'Make sure the user you want to verify if you have this seal',
        }))
    }else {
        await User.update({ verifyed: true }, {
            where: {id: user.id}
        })
        res.status(200).json({
            message: 'This user has been verifyed successfully'
        })
    }
}
export async function unverify_user (req: Request, res: Response) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['verifyed', 'id'],
        where: {id: user_id}
    })

    if(user.verifyed == false){
        res.status(400).send( new ValidationError({
            message: 'This user has not been verifyed previusly',
            action: 'Check that the user you want to remove the verification has this seal',
        }))
    }else {
        await User.update({ verifyed: false }, {
            where: {id: user.id}
        })
        res.status(200).json({
            message: 'This user has been unverifyed successfully'
        })
    }
}

export async function mute_user (req: Request, res: Response) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['muted', 'id'],
        where: {id: user_id}
    })

    if(user.muted == true){
        res.status(400).send( new ValidationError({
            message: 'This user has been muted previously',
            action: 'Make sure the user you want to mute is unmuted',
        }))
    }else {
        await User.update({ muted: true }, {
            where: {id: user.id}
        })
        res.status(200).json({
            message: 'This user has been muted successfully'
        })
    }
}
export async function unmute_user (req: Request, res: Response) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['muted', 'id'],
        where: {id: user_id}
    })

    if(user.muted == false){
        res.status(400).send( new ValidationError({
            message: 'This user has not been muted previusly',
            action: 'Make sure the user you want to unmute has been muted previously',
        }))
    }else {
        await User.update({ muted: false }, {
            where: {id: user.id}
        })
        res.status(200).json({
            message: 'This user has been unmuted successfully'
        })
    }
}
