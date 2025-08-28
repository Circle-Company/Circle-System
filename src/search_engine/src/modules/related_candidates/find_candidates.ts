import { InternalServerError } from "../../../../errors"
import Relation from "../../../../models/user/relation-model"
import User from "../../../../models/user/user-model"
import UserSubscription from "../../../../models/subscription/user-subscription-model"

type RelationProps = {
    id: number
    user_id: bigint
    related_user_id: bigint
    weight: number
}
type FindCandidatesProps = {
    user_id: bigint
}
export async function find_candidates({ user_id }: FindCandidatesProps) {
    try {
        const relations = (await Relation.findAll({
            where: { user_id: user_id },
            attributes: ["related_user_id", "weight"],
        })) as RelationProps[]

        const users_related = Promise.all(
            relations.map(async (relation) => {
                const user = await User.findOne({
                    attributes: ["id", "username"],
                    where: { id: relation.related_user_id },
                })

                const userSubscriptionStatus = await UserSubscription.findOne({
                    where: { user_id: user_id },
                    attributes: ["status"],
                })

                const isPremium = userSubscriptionStatus?.status === 'active' ? true : false

                if (!user)
                    throw new InternalServerError({ message: "Can´t possible find related user." })

                return {
                    user: {
                        username: user.username,
                        user_id: user.id,
                    },
                    weight: relation.weight,
                    is_premium: isPremium,
                }
            })
        )

        return users_related
    } catch (error) {
        console.error("Error in find_search_candidates:", error)
        throw error
    }
}
