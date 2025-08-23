import { ForbiddenError, UnauthorizedError } from "../errors"
import { NextFunction, Request, Response } from "express"

import CONFIG from "../config"
import jwt from "jwt-simple"

// Middleware de validação de autenticação para administradores
// Verifica apenas chave de API secreta e ID do usuário
export async function AdminAuthenticationValidator(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader: any = req.headers.authorization
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

    try {
        // Decodifica o token sem ignorar a verificação da assinatura
        const decoded = jwt.decode(token, CONFIG.JWT_SECRET, false, "HS256")

        // Verifica se o token está expirado
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            return next(
                new UnauthorizedError({
                    message: "Access denied: Token has expired.",
                    action: "Please login again to obtain a new token.",
                })
            )
        }

        if(decoded.admin_key !== CONFIG.CIRCLE_ADMIN_KEY) {
            return next(
                new UnauthorizedError({
                    message: "Access denied: Invalid admin key.",
                    action: "Please provide a valid admin key.",
                })
            )
        }

        // Adiciona informações ao objeto 'req' após validação do token
        req.user_id = decoded.sub // O 'sub' representa o 'userId'
        req.admin_key = decoded.admin_key // Nome de usuário incluído no payload

        // Passa para o próximo middleware ou rota
        next()
    } catch (err: any) {
        return next(
            new UnauthorizedError({
                message: `Access denied: Token verification failed. Reason: ${err.message}.`,
                action: "Please provide a valid token or login again to obtain a new one.",
            })
        )
    }
} 