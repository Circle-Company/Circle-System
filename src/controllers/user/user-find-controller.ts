import { Request, Response } from "express"
import { MFU } from "../../MFU"
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
    const user = await UserService.UserFind.FindSessionByPk({ user_pk })
    return res.status(200).json(user)
}

export async function find_session_user_statistics_by_pk(req: Request, res: Response) {
    const { user_pk } = req.params
    const user = await UserService.UserFind.FindSessionStatisticsByPk({ user_pk })
    return res.status(200).json(user)
}

export async function find_user_data(req: Request, res: Response) {
    const { username } = req.params
    const { user_id } = req.body
    const user = await UserService.UserFind.FindAllData({ username, user_id })
    return res.status(200).json(user)
}

export async function search_user(req: Request, res: Response) {
    const { username_to_search, user_id } = req.body

    const search_result = await UserService.UserFind.SearchUser({
        user_id,
        username_to_search,
    })
    res.status(200).json(search_result)
}

export async function recommender_users(req: Request, res: Response) {
    const { user_id } = req.body

    const recommendations = await UserService.UserFind.RecommenderUsers({ user_id })
    res.status(200).json(recommendations)
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
