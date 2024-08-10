import { NotificationProps } from "../../types"
import { getUsersList } from "./get-users-list"
import { getUsersTokens } from "./get-users-tokens"

type ModuleProps = {
    notification: NotificationProps
}

type ModuleReturnProps = {
    usersIdsList: number[] | []
}

export async function Module({
    notification,
}: ModuleProps): Promise<{ id: number; token: string }[]> {
    if (notification.type == "ADD-TO-MEMORY" || notification.type == "NEW-MEMORY") {
        const usersList = await getUsersList({
            senderUserId: notification.data.senderUserId,
        })
        return await getUsersTokens({
            usersIdsList: usersList,
        })
    } else {
        return await getUsersTokens({
            usersIdsList: [notification.data.receiverUserId],
        })
    }
}
