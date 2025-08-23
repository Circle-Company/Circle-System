import { InternalServerError } from "../../../../errors"
import { Coordinates, haversineDistance } from "../../../../helpers/coordinates_distance"
import Coordinate from "../../../../models/user/coordinate-model"
import { FinduserBlock } from "../../functions/set_interactions/find_user_block"
import { findUserFollow } from "../../functions/set_interactions/find_user_follow"
type FindCandidatesProps = {
    user_id: bigint
    subtracted_candidates: candidateInput[]
}

type candidateInput = {
    id: bigint
    username: string
    verifyed: boolean
    name: string | null
    muted: boolean
    blocked: boolean
    profile_pictures: {
        tiny_resolution: string
    }
    coordinates: {
        latitude: number
        longitude: number
    }
    statistics: { total_followers_num: number }
}

export async function add_candidates_interactions({
    user_id,
    subtracted_candidates,
}: FindCandidatesProps) {
    const user_coords = await Coordinate.findOne({
        attributes: ["user_id", "latitude", "longitude"],
        where: { user_id: user_id.toString() },
    })

    if (!user_coords) throw new InternalServerError({ message: "Error to find user coordinates." })

    return await Promise.all(
        subtracted_candidates.map(async (candidate) => {
            const user_coords_class = new Coordinates(user_coords.latitude, user_coords.longitude)
            const candidate_coords_class = new Coordinates(
                candidate.coordinates.latitude,
                candidate.coordinates.longitude
            )

            const [follow_you, you_block, block_you] = await Promise.all([
                findUserFollow({
                    user_id: candidate.id,
                    followed_user_id: user_id,
                }),
                FinduserBlock({
                    user_id,
                    blocked_user_id: candidate.id,
                }),
                FinduserBlock({
                    user_id: candidate.id,
                    blocked_user_id: user_id,
                }),
            ])
            return {
                id: candidate.id,
                username: candidate.username,
                verifyed: candidate.verifyed,
                name: candidate.name,
                muted: candidate.muted,
                blocked: candidate.blocked,
                profile_picture: candidate.profile_pictures,
                statistic: candidate.statistics,
                follow_you: Boolean(follow_you),
                you_block: Boolean(you_block),
                block_you: Boolean(block_you),
                distance: haversineDistance(user_coords_class, candidate_coords_class),
            }
        })
    )
}
