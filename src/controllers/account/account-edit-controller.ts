import { Request, Response } from 'express'
import { ValidationError } from "../../errors"
import { ContainSpecialCharacters } from '../../helpers/contain-special-characters'
import { FindUserAlreadyExists } from '../../helpers/find-user-already-exists'

const User = require('../../models/user/user-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')
const Coordinate = require('../../models/user/coordinate-model.js')

export async function edit_user_description (req: Request, res: Response) {
    const { user_id, description }  = req.body

    if(description.length < 4 ){
        res.status(400).send( new ValidationError({
            message: 'The user description must contain at least 4 characters',
            statusCode: 200
        }))
    }else {
        try{
            await User.update({ description: description }, {
                where: {id: user_id}
            })     
            res.status(200).json({
                message: 'This user description has been updated successfully'
            })                       
        } catch {
            res.status(400).send( new ValidationError({
                message: 'It was not possible to edit the description of this user',
                action: 'Make sure the user has a description to be edited'
            }))
        }
    }
}
export async function edit_user_name (req: Request, res: Response) {
    const { user_id, name } = req.body

    if(name.length < 4 ){
        res.status(400).send( new ValidationError({
            message: 'The user name must contain at least 4 characters',
            action: 'try editing the password'
        }))
    }else if(await ContainSpecialCharacters({text: name, allow_space_point: false})) {
        res.status(400).send( new ValidationError({
            message: 'your name cannot contain special characters',
            action: 'try editing the name'
        }))
    }else {
        try{
            await User.update({ name: name }, {
                where: {id: user_id}
            })     
            res.status(200).json({
                message: 'This user name has been updated successfully'
            })                       
        } catch {
            res.status(400).send( new ValidationError({
                message: 'It was not possible to edit the name of this user',
                action: 'Make sure the user has a name to be edited'
            }))
        }
    }
}
export async function edit_user_username (req: Request, res: Response) {
    const { user_id, username } = req.body

    if (username.length < 4 && username.length > 20){
        res.status(400).send( new ValidationError({
            message: 'Your username must contain 4 to 20 characters',
        }))
    }else if (await ContainSpecialCharacters({text: username})) {
        res.status(400).send( new ValidationError({
            message: "your username can only contain '_' and '.' as special characters",
        }))
    }else if (await FindUserAlreadyExists({username: username}) === true){
        res.status(400).send( new ValidationError({
            message: 'this username already exists',
        }))
    }else {
        try{
            await User.update({ username: username }, {
                where: {id: user_id}
            })     
            res.status(200).json({
                message: 'This user username has been updated successfully'
            })                       
        } catch {
            res.status(400).send( new ValidationError({
                message: 'It was not possible to edit the username of this user',
            }))
        }
    }
}
export async function edit_profile_picture (req: Request, res: Response) {
    const {
        user_id,
        fullhd_resolution,
        tiny_resolution
    } = req.body
    try{
        ProfilePicture.update({
            fullhd_resolution: fullhd_resolution,
            tiny_resolution: tiny_resolution
        }, { where: {user_id: user_id}})

        res.status(200).json({
            message: 'This user profile picture has been edited successfully'
        })  
    } catch {
        res.status(400).send( new ValidationError({
            message: 'It was not possible to edit the profile picture of this user',
            action: 'Make sure the user has a profile picture to be edited'
        }))
    }

  
}
export async function edit_coordinates(req: Request, res: Response) {
    const {
        user_id,
        latitude,
        longitude
    } = req.body
    try{
        Coordinate.update({
            latitude: latitude,
            longitude: longitude
        }, { where: {user_id: user_id}})

        res.status(200).json({
            message: 'This user coordinates has been edited successfully'
        })  
    } catch {
        res.status(400).send( new ValidationError({
            message: 'It was not possible to edit the coordinates of this user',
            action: 'Make sure the user has a coordinates to be edited'
        }))
    }
}