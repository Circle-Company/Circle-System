import jwt from "jsonwebtoken"
import UserModel from "../models/user/user-model.js"
import CONFIG from "./../config"

type JwtEncoderProps = {
    username: string
    userId: number
}

export async function jwtEncoder({ username, userId }: JwtEncoderProps): Promise<string> {
    // Obtendo o usuário do banco de dados
    const user = await UserModel.findOne({ where: { id: userId } })

    if (!user) {
        throw new Error("User not found")
    }

    // Definindo o payload de forma segura, incluindo apenas o necessário
    const payload = {
        sub: userId.toString(), // Subject, geralmente o ID do usuário
        username: username, // Nome de usuário
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
