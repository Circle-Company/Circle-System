import { ValidationError } from "../errors"
import { FindUserAlreadyExists } from "./find-user-already-exists"

export async function useUsernameValidator(username: string) {
    if (username.length < 4 && username.length > 20) {
        throw new ValidationError({
            message: "Your username must contain 4 to 20 characters.",
            action: "Please, add more charcters.",
        })
    } else if (username.startsWith(".") || username.endsWith(".")) {
        throw new ValidationError({
            message: "Username cannot start or end with a dot.",
            action: "Remove the dot from the beginning or end.",
        })
    } else if (/\.{2,}/.test(username) || /_{2,}/.test(username)) {
        throw new ValidationError({
            message: "Username cannot contain multiple dots or underscores in a row.",
            action: "Use only single '.' or '_' without repeating.",
        })
    } else if ((await FindUserAlreadyExists({ username: username.toLowerCase() })) === true) {
        throw new ValidationError({
            message: "This username already exists.",
            action: "Please try another username.",
        })
    } else return username
}
