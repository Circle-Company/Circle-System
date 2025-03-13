import jwt from "jwt-simple"
import { ValidationError } from "../errors"
import UserModel from "../models/user/user-model"
import CONFIG from "./../config"

type JwtEncoderProps = {
    username: string
    userId: string
    //ipAddress: string
}

export async function jwtEncoder({
    username,
    userId,
}: //ipAddress,
JwtEncoderProps): Promise<string> {
    // Obtendo o usuário do banco de dados
    const user = await UserModel.findByPk(userId)
    if (!user) {
        throw new ValidationError({
            message: "User not found",
            action: "Check if User is passed correctly",
        })
    }
    if (user.username !== username)
        throw new ValidationError({
            message: "Username or ID is not matching.",
            action: "Check if Username and ID belongs the same user.",
        })
    /**
    if (!ipAddress) {
        throw new UnauthorizedError({
            message: `you must pass the "ipAddress"`,
            action: "check if the ipAddress was passed correctly",
        })
    } 
    if (!isValidIP(ipAddress)) {
        throw new UnauthorizedError({
            message: "the ip address passed is in an incorrect format",
            action: "check if the passed ip is in the format XXX.XXX.X.X or XXX.XXX.XX.X",
        })
    }
*/
    const payload = {
        sub: String(userId), // ID do usuário
        username: username, // Nome de usuário
        iat: Math.floor(Date.now() / 1000), // Timestamp de emissão
        exp: Math.floor(Date.now() / 1000) + Number(CONFIG.JWT_EXPIRES), // Expiração
        iss: CONFIG.JWT_ISSUER, // Emissor
        aud: CONFIG.JWT_AUDIENCE, // Audiência
    }

    // Geração do token com assinatura segura usando HS256
    return jwt.encode(payload, CONFIG.JWT_SECRET, "HS256")
}
