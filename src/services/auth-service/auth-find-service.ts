import {UsernameAlreadyInUseProps} from "./types"

import User from '../../models/user/user-model.js'
import Coordinate from '../../models/user/coordinate-model.js'
import Statistic from '../../models/user/statistic-model.js'
import ProfilePicture from '../../models/user/profilepicture-model.js'
import Contact from '../../models/user/contact-model.js'

export async function find_username_already_in_use({
    username
}: UsernameAlreadyInUseProps) {

    const hasUser = await User.findOne({ where: {username}})
    if (!hasUser) return {message: 'This username is available for use.', enable_to_use: true}
    else return {message: 'This username is already in use, try another.', enable_to_use: false}
}