import { ValidationError } from "../../errors"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists"

const User = require('../../models/user/user-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')
const Statistic = require('../../models/user/statistic-model.js')

export async function edit_user_description (req: any, res: any) {
    const { user_id }  = req.body
    const { description } = req.body

    if(description.length < 4 ){
        res.send( new ValidationError({
            message: 'The user description must contain at least 4 characters',
            statusCode: 200
        }))
    }else {
        await User.update({ description: description }, {
            where: {id: user_id}
        })
        res.status(200).json({
            message: 'This user description has been updated successfully'
        })        
    }
}

export async function delete_user_description (req: any, res: any) {
    const { user_id }  = req.body
    await User.update({ description: null }, {
        where: {id: user_id}
    })
    res.status(200).json({
        message: 'This user description has been deleted successfully'
    })        
}