import { ValidationError } from "../errors"
import { FindUserAlreadyExists } from "../helpers/find-user-already-exists"

export class Username {
    private value: string

    constructor(username: string) {
        this.value = username.toLowerCase()
    }

    public async validate(): Promise<string> {
        if (this.value.length < 4 || this.value.length > 20) {
            throw new ValidationError({
                message: "Your username must contain 4 to 20 characters.",
                action: "Please, add more characters.",
            })
        }

        if (this.value.startsWith(".") || this.value.endsWith(".")) {
            throw new ValidationError({
                message: "Username cannot start or end with a dot.",
                action: "Remove the dot from the beginning or end.",
            })
        }

        if (/\.{2,}/.test(this.value) || /_{2,}/.test(this.value)) {
            throw new ValidationError({
                message: "Username cannot contain multiple dots or underscores in a row.",
                action: "Use only single '.' or '_' without repeating.",
            })
        }

        if (await FindUserAlreadyExists({ username: this.value.toLowerCase() })) {
            throw new ValidationError({
                message: "This username already exists.",
                action: "Please try another username.",
            })
        }

        return this.value
    }

    public getValue(): string {
        return this.value
    }
}
