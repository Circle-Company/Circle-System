import Follow from "../../../../models/user/follow-model.js"

type FindUserFollow = {
    user_id: bigint
    followed_user_id: bigint
}

export async function findUserFollow({
    user_id,
    followed_user_id,
}: FindUserFollow): Promise<boolean> {
    const user_followed = await Follow.findOne({
        attributes: ["followed_user_id", "user_id"],
        where: { followed_user_id: followed_user_id.toString(), user_id: user_id.toString() },
    })

    return Boolean(user_followed)
}
