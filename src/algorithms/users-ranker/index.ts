import { Coordinates, haversineDistance } from "../../helpers/coordinates_distance.js"
import { sigmoid } from "../../math/sigmoid"
import CoordinateModel from "../../models/user/coordinate-model.js"
import ProfilePicture from "../../models/user/profilepicture-model.js"
import Relation from "../../models/user/relation-model.js"
import Statistic from "../../models/user/statistic-model.js"
import User from "../../models/user/user-model.js"
import { FinduserBlock } from "../../search_engine/src/functions/set_interactions/find_user_block.js"
import { findUserFollow } from "../../search_engine/src/functions/set_interactions/find_user_follow"
import { UserObject, calcule_score } from "./calculeScore.js"

type UserWithMandatoryId = {
    id: number
    [key: string]: any // Permite qualquer outra propriedade
}

type usersRankerAlgorithmProps = {
    userId: number
    usersList: Array<UserWithMandatoryId>
}
type RelationProps = {
    id: number
    user_id: number
    related_user_id: number
    weight: number
}

export async function usersRankerAlgorithm({ userId, usersList }: usersRankerAlgorithmProps) {
    try {
        const ListWithData = await Promise.all(
            usersList.map(async (user, index) => {
                const relation: RelationProps = await Relation.findOne({
                    where: { user_id: userId, related_user_id: user.id },
                    attributes: ["related_user_id", "weight"],
                })

                const userCoordinates = await CoordinateModel.findOne({
                    where: { user_id: userId },
                    attributes: ["latitude", "longitude"],
                })

                const you_block = await FinduserBlock({
                    user_id: userId,
                    blocked_user_id: user.id,
                })
                const block_you = await FinduserBlock({
                    user_id: user.id,
                    blocked_user_id: userId,
                })

                const userInformations = await User.findOne({
                    attributes: ["id", "username", "verifyed", "muted", "blocked", "name"],
                    where: { id: user.id },
                    include: [
                        {
                            model: ProfilePicture,
                            as: "profile_pictures",
                            attributes: ["tiny_resolution"],
                        },
                        {
                            model: Statistic,
                            as: "statistics",
                            attributes: ["total_followers_num"],
                        },
                        {
                            model: CoordinateModel,
                            as: "coordinates",
                        },
                    ],
                })

                const user_coords_class = new Coordinates(
                    userCoordinates.latitude,
                    userCoordinates.longitude
                )
                const candidate_coords_class = new Coordinates(
                    user.coordinates.latitude,
                    user.coordinates.longitude
                )

                const isYou = user.id == userId ? true : false

                if (!userInformations || userInformations.blocked || you_block) return null

                return {
                    ...user,
                    verifyed: userInformations.verifyed,
                    muted: userInformations.muted,
                    block_you: Boolean(block_you),
                    follow_you: Boolean(
                        await findUserFollow({ user_id: user.id, followed_user_id: userId })
                    ),
                    you_follow: Boolean(
                        await findUserFollow({ user_id: userId, followed_user_id: user.id })
                    ),
                    has_profile_picture: Boolean(userInformations.profile_pictures.tiny_resolution),
                    total_followers_num: sigmoid(
                        userInformations.statistics.total_followers_num / 100
                    ),
                    distance: isYou
                        ? 0
                        : haversineDistance(user_coords_class, candidate_coords_class),
                    relation_weight: relation.weight,
                    is_you: isYou,
                }
            })
        )
        // Filtro para garantir que valores nulos sejam removidos
        const cleanedList: UserObject[] = ListWithData.filter(
            (user): user is UserObject => user !== null
        )

        const listWithScore = calcule_score({ candidates: cleanedList })

        return listWithScore
    } catch (error) {
        console.error("Error in find_search_candidates:", error)
        throw error
    }
}
