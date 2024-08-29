import { compare, hashSync } from "bcryptjs"

type EncriptedPasswordProps = {
    password: string
}

export async function EncriptedPassword({ password }: EncriptedPasswordProps): Promise<string> {
    const encripted_password = hashSync(password, 10)
    return encripted_password
}

type DecriptPasswordProps = {
    password1: string
    password2: string
}
export async function DecryptPassword({
    password1,
    password2,
}: DecriptPasswordProps): Promise<boolean> {
    if (await compare(password1, password2)) return true
    else return false
}
