import UserToken from "../../../models/notification/notification_token-model.js"
type GetUsersTokensProps = {
    usersIdsList: bigint[]
}

type GetUsersTokensReturnProps = Array<{
    id: bigint
    token: string
}>

export async function getUsersTokens({
    usersIdsList,
}: GetUsersTokensProps): Promise<GetUsersTokensReturnProps> {
    return await Promise.all(
        usersIdsList.map(async (userId) => {
            const userToken = (await UserToken.findOne({
                where: { user_id: userId },
                attributes: ["token"],
            })) as any
            return { id: userId, token: userToken ? userToken.token : null }
        })
    )
}
