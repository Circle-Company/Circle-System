import { NextFunction, Request, Response } from "express"
import { MFU } from "../../MFU"
import { InternalServerError, UnauthorizedError, ValidationError } from "../../errors"
import { UserService } from "../../services/user-service"

export async function find_user_by_username(req: Request, res: Response) {
    const { username } = req.params
    const { user_id } = req.body
    try {
        const user = await UserService.UserFind.FindByUsername({ username, user_id })
        return res.status(200).json(user)
    } catch (err: any) {
        console.log(err)
    }
}

export async function find_user_by_pk(req: Request, res: Response) {
    const { user_pk } = req.params
    const { user_id } = req.body
    const user = await UserService.UserFind.FindByPk({ user_id, user_pk })
    return res.status(200).json(user)
}

export async function find_session_user_by_pk(req: Request, res: Response) {
    const { user_pk } = req.params
    const user = await UserService.UserFind.FindSessionByPk({ user_pk: BigInt(user_pk) })
    return res.status(200).json(user)
}

export async function find_session_user_statistics_by_pk(req: Request, res: Response) {
    const { user_pk } = req.params
    const user = await UserService.UserFind.FindSessionStatisticsByPk({ user_pk })
    return res.status(200).json(user)
}

export async function find_user_data(req: Request, res: Response, next: NextFunction) {
    const { username } = req.params

    try {
        // Verifica se user_id está presente
        if (!req.user_id) {
            throw new UnauthorizedError({
                message: "User ID is missing. You must be authenticated to access this resource.",
            })
        }

        // Busca os dados do usuário
        const user = await UserService.UserFind.FindAllData({ username, user_id: req.user_id })

        // Retorna os dados do usuário encontrados
        return res.status(200).json(user)
    } catch (err: unknown) {
        console.error("Error finding user data:", err)

        // Verifica o tipo de erro e retorna a resposta apropriada
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message })
        } else if (err instanceof UnauthorizedError) {
            return res.status(401).json({ error: err.message })
        } else {
            // Em caso de erro interno inesperado, retorna um status 500
            return res.status(500).json({ error: "An unexpected error occurred." })
        }
    }
}

export async function search_user(req: Request, res: Response) {
    const { username_to_search, user_id } = req.body
    console.log({ username_to_search, user_id })

    const search_result = await UserService.UserFind.SearchUser({
        user_id: BigInt(user_id),
        username_to_search,
    })
    res.status(200).json(search_result)
}

export async function recommender_users(req: Request, res: Response) {
    const { user_id } = req.body

    const recommendations = await UserService.UserFind.RecommenderUsers({ user_id })
    res.status(200).json(recommendations)
}

export async function find_user_followers(req: Request, res: Response) {
    const page = parseInt(req.query.page as string, 10) || 1
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10

    if (!req.user_id) throw new InternalServerError({ message: "req.user_id can not be null." })
    const result = await UserService.UserFind.FinduserFollowers({
        user_pk: BigInt(req.params.id),
        user_id: BigInt(req.user_id),
        page,
        pageSize,
    })
    res.status(200).json(result)
}

export async function find_most_followed_users(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string, 10) || 1
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10
        const ranking = await MFU({ page, pageSize })

        res.status(200).json(ranking)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Erro ao obter os usuários mais seguidos." })
    }
}
