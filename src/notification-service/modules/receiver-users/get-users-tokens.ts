import UserToken from "../../../models/notification/notification_token-model.js"
type GetUsersTokensProps = {
    usersIdsList: number[]
}

type GetUsersTokensReturnProps = Array<{
    id: number
    token: string
}>

export async function getUsersTokens({
    usersIdsList,
}: GetUsersTokensProps): Promise<GetUsersTokensReturnProps> {
    return await Promise.all(
        usersIdsList.map(async (userId) => {
            // @ts-ignore
                where: { user_id: userId },
                attributes: ["token"],
            })
            return { id: userId, token: userToken ? userToken.token : null }
        })
    )
}
