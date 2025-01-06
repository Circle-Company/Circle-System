import jwt from "jsonwebtoken"
import { ValidationError } from "../errors"
import UserModel from "../models/user/user-model"
import CONFIG from "./../config"

type JwtEncoderProps = {
    username: string
    userId: bigint
    //ipAddress: string
}

export async function jwtEncoder({
    username,
    userId,
}: //ipAddress,
JwtEncoderProps): Promise<string> {
    // Obtendo o usuário do banco de dados
    const user = await UserModel.findByPk(BigInt(userId))
    if (!user) {
        throw new Error("User not found")
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
    // Definindo o payload de forma segura, incluindo apenas o necessário
    const payload = {
        sub: String(userId), // Subject, geralmente o ID do usuário
        username: username, // Nome de usuário
        //ip: ipAddress,
        iat: Math.floor(Date.now() / 1000), // Timestamp de emissão
    }

    // Configurações de assinatura do token
    const options: jwt.SignOptions = {
        algorithm: "HS256", // Algoritmo de assinatura seguro
        expiresIn: CONFIG.JWT_EXPIRES, // Tempo de expiração do token
        issuer: CONFIG.JWT_ISSUER, // Emissor do token
        audience: CONFIG.JWT_AUDIENCE, // Audiência do token
    }

    // Geração do token com assinatura segura
    return jwt.sign(payload, CONFIG.JWT_SECRET, options)
}
