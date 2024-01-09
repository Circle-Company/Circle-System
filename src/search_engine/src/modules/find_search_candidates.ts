import {FindSearchCandidatesProps} from "../types"
import { Op } from "sequelize"

const User = require('../../../models/user/user-model.js')
const ProfilePicture = require('../../../models/user/profilepicture-model.js')
const Statistic = require('../../../models/user/statistic-model.js')
const Coordinate = require('../../../models/user/coordinate-model.js')

export async function find_search_candidates({
    user_id,
    username_to_search
}: FindSearchCandidatesProps) {

    const user_coordinates = await Coordinate.findOne({
        attributes: ['latitude', 'longitude'],
        where: { user_id: user_id }
    })

    const users = await User.findAll({
        attributes: ['id','username', 'verifyed', 'name', 'muted' ],
        where: {
            username: {[Op.like]: `%${username_to_search}%`},
            id: {[Op.not]: user_id},
            blocked: {[Op.not]: true},
            deleted: {[Op.not]: true}
        },
        include: [
            {
                model: Coordinate,
                as: 'coordinates',
                attributes: ['latitude', 'longitude']
            },
            {
                model: ProfilePicture,
                as: 'profile_pictures',
                attributes: ['fullhd_resolution', 'tiny_resolution']
            },
            {
                model: Statistic,
                as: 'statistics',
                attributes: ['total_followers_num']
            }
        ],
        limit: 20
    })

    return {
        users: users,
        user_coordinates: user_coordinates,
        user_id: user_id
    }

}