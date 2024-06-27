import { UserProps } from "../../types";
import Block from '../../../../models/user/block-model.js'

type FindUserBlock = {
    user_id: number,
    blocked_user_id: number
}

export async function FinduserBlock({
    user_id, blocked_user_id
}: FindUserBlock): Promise<boolean | null> {
    const user_blocked = await Block.findOne({
        attributes: ['blocked_user_id', 'user_id'],
        where: { blocked_user_id, user_id}
    })
    return Boolean(user_blocked)
}