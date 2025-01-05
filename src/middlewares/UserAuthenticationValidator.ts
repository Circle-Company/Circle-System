import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import CONFIG from "../config"
import { UnauthorizedError } from "../errors"

// Middleware de validação de autenticação JWT
export async function UserAuthenticationValidator(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader: any = req.headers.authorization_token

    // Verifica se o cabeçalho de autorização está presente
    if (!authHeader) {
        return next(
            new UnauthorizedError({
                message: "Access denied: Missing authorization token.",
                action: "Please provide a valid Bearer token in the authorization header.",
            })
        )
    }

    // Divide o cabeçalho para obter o esquema e o token
    const [scheme, token] = authHeader.split(" ")

    // Verifica se o esquema é 'Bearer' e se o token está presente
    if (!token || scheme !== "Bearer") {
        return next(
            new UnauthorizedError({
                message: "Access denied: Invalid authorization format.",
                action: "Ensure the token is in the format: Bearer <token>.",
            })
        )
    }

    // Verifica e decodifica o token JWT
    jwt.verify(token, CONFIG.JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            return next(
                new UnauthorizedError({
                    message: `Access denied: Token verification failed. Reason: ${err.message}.`,
                    action: "Please provide a valid token or login again to obtain a new one.",
                })
            )
        }

        // Adiciona informações ao objeto 'req' após validação do token
        if (decoded) {
            req.user_id = decoded.sub // O 'sub' representa o 'userId'
            req.username = decoded.username // Nome de usuário incluído no payload
        }

        // Passa para o próximo middleware ou rota
        next()
    })
}
