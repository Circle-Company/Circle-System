import { InternalServerError } from "../../../../errors/index.js"
import Relation from "../../../../models/user/relation-model.js"
import User from "../../../../models/user/user-model.js"

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
        const relations: RelationProps[] = await Relation.findAll({
            where: { user_id },
            attributes: ["related_user_id", "weight"],
        })

        const users_related = Promise.all(
            relations.map(async (relation) => {
                const user = await User.findOne({
                    attributes: ["id", "username"],
                    where: { id: relation.related_user_id },
                })

                if (!user)
                    throw new InternalServerError({ message: "Can´t possible find related user." })

                return {
                    user: {
                        username: user.username,
                        user_id: user.id,
                    },
                    weight: relation.weight,
                }
            })
        )

        return users_related
    } catch (error) {
        console.error("Error in find_search_candidates:", error)
        throw error
    }
}
