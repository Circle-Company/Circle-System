import { Coordinates, haversineDistance } from "../../../helpers/coordinates_distance"
import { AddCandidatesInteractionsProps, UserProps} from "../types"
import Candidate from "../classes/candidate"

const Follow = require('../../../models/user/follow-model.js')
const Block = require('../../../models/user/block-model.js')

export async function add_candidates_interactions({
    users,
    user_coordinates,
    user_id
}: AddCandidatesInteractionsProps) {
    
    const result = await Promise.all(
        users.map(async( user: UserProps ) => {

        const user_cords = new Coordinates(
            user_coordinates.latitude,
            user_coordinates.longitude
        )
        const compared_user_cords = new Coordinates(
            user.coordinates.latitude,
            user.coordinates.longitude
        )
        // check if the user follows me
        const user_followed = await Follow.findOne({
            attributes: ['followed_user_id', 'user_id'],
            where: { followed_user_id: user_id, user_id: user.id }
        })
        // check if I follow the user
        const user_follow = await Follow.findOne({
            attributes: ['followed_user_id', 'user_id'],
            where: { followed_user_id: user.id, user_id: user_id }
        })
        // check if the user blocked me
        const user_blocked = await Block.findOne({
            attributes: ['blocked_user_id', 'user_id'],
            where: { blocked_user_id: user_id, user_id: user.id }
        })        
        //check if I blocked the user
        const user_block = await Block.findOne({
            attributes: ['blocked_user_id', 'user_id'],
            where: { blocked_user_id: user.id, user_id: user_id }
        })
        if(Boolean(user_block)) return null

        const distance = haversineDistance(user_cords, compared_user_cords)

        return new Candidate(
            user.id,
			user.username,
			user.verifyed,
			user.name,
			user.muted,
			{
				fullhd_resolution: user.profile_pictures.fullhd_resolution,
				tiny_resolution: user.profile_pictures.tiny_resolution
			},
            Boolean(user_followed),
            Boolean(user_follow),
            Boolean(user_blocked),
            distance,
			user.statistics.total_followers_num
        )
    }))

    const candidates = result.filter((candidate) => candidate !== null && candidate !== undefined)

    return { candidates }
}