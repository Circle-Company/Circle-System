import Coordinate from "../../../../models/user/coordinate-model"
import ProfilePicture from "../../../../models/user/profilepicture-model"
import Statistic from "../../../../models/user/statistic-model"
import User from "../../../../models/user/user-model"
import { filterSearchParams } from "../../functions/filter_search_params"

type FindCandidatesProps = {
    user_id: bigint
    search_term: string
}
export async function find_candidates({ user_id, search_term }: FindCandidatesProps) {
    try {
        const users = await User.findAll({
            attributes: ["id", "username", "verifyed", "muted", "name", "blocked"],
            where: filterSearchParams({ user_id: user_id, search_term }),
            include: [
                {
                    model: Coordinate,
                    as: "coordinates",
                    attributes: ["latitude", "longitude"],
                },
                {
                    model: Statistic,
                    as: "statistics",
                    attributes: ["total_followers_num"],
                },
                {
                    model: ProfilePicture,
                    as: "profile_pictures",
                    attributes: ["tiny_resolution"],
                },
            ],
            limit: 1000,
        })

        return users
    } catch (error) {
        console.error("Error in find_search_candidates:", error)
        throw error
    }
}
