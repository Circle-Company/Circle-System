import User from '../../../models/user/user-model.js'
import Relation from '../../../models/user/relation-model.js'
import { ServiceError } from '../../../errors'

type RelationProps = {
    id: number,
    user_id: number,
    related_user_id: number,
    weight: number
}
type FindCandidatesProps = {
    user_id: number
}
export async function find_candidates({
    user_id
}: FindCandidatesProps) {
    try {
        const relations: RelationProps[] = await Relation.findAll({
            where: {user_id},
            attributes: ['related_user_id', 'weight']
        })

        const users_related = Promise.all(
            relations.map(async (relation) => {
                const user = await User.findOne({
                    attributes: ['id', 'username'],
                    where: {id: relation.related_user_id},
                })

                return {
                    user: {
                        username: user.username,
                        user_id: user.id
                    },
                    weight: relation.weight
                }
            })
        )

        return users_related
    } catch (error: any) {
        throw new ServiceError({message: error.message})
    }
}