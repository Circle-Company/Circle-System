import Follow from "../../../models/user/follow-model"
type GetUsersListProps = {
    senderUserId: number
}

export async function getUsersList({ senderUserId }: GetUsersListProps): Promise<number[]> {
    const followsList = await Follow.findAll({
        where: { followed_user_id: senderUserId },
        attributes: ["user_id"],
    })

    if (followsList.length == 0) return []
    else
        return followsList.map((user) => {
            return Number(user.user_id)
        })
}
