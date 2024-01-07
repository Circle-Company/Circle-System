import { ValidationError } from "../../errors"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists"

const User = require('../../models/user/user-model.js')

export async function block_user (req: any, res: any) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['blocked', 'id'],
        where: {id: user_id}
    })

    if(user.blocked == true){
        res.send( new ValidationError({
            message: 'This user has been blocked previously',
            statusCode: 200
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
export async function unlock_user (req: any, res: any) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['blocked', 'id'],
        where: {id: user_id}
    })

    if(user.blocked == false){
        res.send( new ValidationError({
            message: 'This user has not been blocked previusly',
            statusCode: 200
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

export async function verify_user (req: any, res: any) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['verifyed', 'id'],
        where: {id: user_id}
    })

    if(user.verifyed == true){
        res.send( new ValidationError({
            message: 'This user has been verifyed previously',
            statusCode: 200
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
export async function unverify_user (req: any, res: any) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['verifyed', 'id'],
        where: {id: user_id}
    })

    if(user.verifyed == false){
        res.send( new ValidationError({
            message: 'This user has not been verifyed previusly',
            statusCode: 200
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

export async function mute_user (req: any, res: any) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['muted', 'id'],
        where: {id: user_id}
    })

    if(user.muted == true){
        res.send( new ValidationError({
            message: 'This user has been muted previously',
            statusCode: 200
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
export async function unmute_user (req: any, res: any) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['muted', 'id'],
        where: {id: user_id}
    })

    if(user.muted == false){
        res.send( new ValidationError({
            message: 'This user has not been muted previusly',
            statusCode: 200
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

export async function delete_user (req: any, res: any) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['deleted', 'id'],
        where: {id: user_id}
    })

    if(user.deleted == true){
        res.send( new ValidationError({
            message: 'This user has been deleted previously',
            statusCode: 200
        }))
    }else {
        await User.update({ deleted: true }, {
            where: {id: user.id}
        })
        res.status(200).json({
            message: 'This user has been deleted successfully'
        })
    }
}
export async function undelete_user (req: any, res: any) {
    const { user_id }  = req.body

    const user = await User.findOne({
        attributes: ['deleted', 'id'],
        where: {id: user_id}
    })

    if(user.deleted == false){
        res.send( new ValidationError({
            message: 'This user has not been deleted previusly',
            statusCode: 200
        }))
    }else {
        await User.update({ deleted: false }, {
            where: {id: user.id}
        })
        res.status(200).json({
            message: 'This user has been undeleted successfully'
        })
    }
}

