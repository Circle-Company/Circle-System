import User from "../models/user/user-model"

type FindUserAlreadyExistsProps = {
    username: string
}

export async function FindUserAlreadyExists({
    username,
}: FindUserAlreadyExistsProps): Promise<boolean> {
    const userFind = await User.findOne({
        attributes: ["username"],
        where: { username: username },
    })
    if (userFind) return true
    else return false
}
