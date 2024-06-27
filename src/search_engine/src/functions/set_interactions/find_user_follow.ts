import { UserProps } from "../../types"
import Follow from '../../../../models/user/follow-model.js'

type FindUserFollow = {
    user_id: number,
    followed_user_id: number
}

export async function findUserFollow({
    user_id, followed_user_id
}: FindUserFollow): Promise<boolean> {
    const user_followed = await Follow.findOne({
        attributes: ['followed_user_id', 'user_id'],
        where: { followed_user_id, user_id}
    })

    return Boolean(user_followed)
}