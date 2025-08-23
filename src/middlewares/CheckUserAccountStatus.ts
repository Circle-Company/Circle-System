import { NextFunction, Request, Response } from "express"
import { NotFoundError } from "../errors"
import User from "../models/user/user-model"

export async function CheckUserAccountStatus(req: Request, res: Response, next: NextFunction) {
    const { username } = req.params

    try {
        // Obtenha o usuário pelo username
        const user = await User.findOne({ where: { username } })

        if (!user) {
            throw new NotFoundError({ message: "User not found." })
        }

        // Verifica se a conta está bloqueada
        if (user.blocked) {
            throw new NotFoundError({
                message:
                    "This account has been blocked for violating Circle's terms of use, privacy, or community guidelines.",
            })
        }

        // Verifica se a conta foi excluída
        if (user.deleted) {
            throw new NotFoundError({
                message: "It looks like this account was deleted from Circle.",
            })
        }

        // Anexa o objeto `user` ao objeto `req` para uso posterior nas rotas
        req.user = user
        next()
    } catch (err: unknown) {
        console.error("Error in CheckUserAccountStatus middleware:", err)
        next(err) // Propaga o erro para o middleware de tratamento de erros
    }
}
