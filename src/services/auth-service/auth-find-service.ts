import User from "../../models/user/user-model"
import { UsernameAlreadyInUseProps } from "./types"

export async function find_username_already_in_use({ username }: UsernameAlreadyInUseProps) {
    const hasUser = await User.findOne({ where: { username }, attributes: ["username"] })
    if (!hasUser) return { message: "This username is available for use.", enable_to_use: true }
    else return { message: "This username is already in use, try another.", enable_to_use: false }
}
