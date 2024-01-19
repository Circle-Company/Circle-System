import {Request, Response } from 'express'
import { UserService } from '../../services/user-service'
import { FindMostFamousEngine } from '../../find_most_famous_engine'

export async function find_user_by_username (req: Request, res: Response) {
    const { username }  = req.params
    const { user_id } = req.body
    const user = await UserService.UserFind.FindByUsername({username, user_id})
    return res.status(200).json(user)
}

export async function find_user_data (req: Request, res: Response) {
    const { username }  = req.params
    const { user_id } = req.body
    const user = await UserService.UserFind.FindAllData({username, user_id})
    return res.status(200).json(user)
}

export async function search_user (req: Request, res: Response) {
    const { username_to_search, user_id } = req.body

    const search_result = await UserService.UserFind.SearchUser({
        user_id,
        username_to_search
    })
    res.status(200).json(search_result)
}

export async function recommender_users (req: Request, res: Response) {
    const { user_id } = req.body

    const recommendations = await UserService.UserFind.RecommenderUsers({user_id})
    res.status(200).json(recommendations)
}