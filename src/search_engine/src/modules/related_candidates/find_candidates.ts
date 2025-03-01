<<<<<<< Updated upstream
import { InternalServerError } from "../../../../errors"
import Relation from "../../../../models/user/relation-model"
import User from "../../../../models/user/user-model"

=======
const Relation = require('../../../../models/user/relation-model.js')
const User = require('../../../../models/user/user-model.js')
import { InternalServerError } from "../../../../errors"
>>>>>>> Stashed changes
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
        throw new InternalServerError({
            message: 'Error in find_search_candidates'
        })
    }
}
