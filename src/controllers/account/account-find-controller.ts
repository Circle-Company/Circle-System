import { Request, Response } from "express"
import { ValidationError } from "../../errors"
import Like from "../../models/moments/like-model"
import Follow from "../../models/user/follow-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model"
import User from "../../models/user/user-model"

export async function findAccountFollowings(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user_id) {
            throw new ValidationError({
                message: "User ID is required to fetch followings.",
                action: "Ensure the user is authenticated and their ID is provided.",
            })
        }

        // Obtenção de query params para paginação com valores padrão
        const limit = parseInt(req.query.limit as string, 10) || 10 // Número máximo de registros por página
        const page = parseInt(req.query.page as string, 10) || 1 // Número da página
        const offset = (page - 1) * limit

        // Consulta paginada
        const { rows: followingUsers, count: totalItems } = await Follow.findAndCountAll({
            where: { user_id: String(req.user_id) },
            attributes: [],
            include: [
                {
                    model: User,
                    as: "followers",
                    where: { blocked: false, deleted: false },
                    attributes: ["id", "username", "name", "verifyed"],
                    include: [
                        {
                            model: ProfilePicture,
                            as: "profile_pictures",
                            attributes: ["tiny_resolution"],
                        },
                        {
                            model: Statistic,
                            as: "statistics",
                            attributes: ["total_followers_num"],
                        },
                    ],
                },
            ],
            limit,
            offset,
        })

        const filteredList: any = followingUsers.map((item: any) => {
            return {
                id: item.followers.id,
                username: item.followers.username,
                verifyed: item.followers.verifyed,
                profile_picture: item.followers.profile_pictures,
                statistic: item.followers.statistics,
            }
        })

        // Construção do objeto de paginação
        const totalPages = Math.ceil(totalItems / limit)

        res.status(200).json({
            data: filteredList,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        })
    } catch (error) {
        console.error("Error fetching following users:", error)

        if (error instanceof ValidationError) {
            res.status(400).json(error)
        }
    }
}

export async function findLikedMoments(req: Request, res: Response): Promise<void> {
    try {
        const { user_id } = req

        if (!user_id) {
            throw new ValidationError({
                message: "User ID is required to fetch followings.",
                action: "Ensure the user is authenticated and their ID is provided.",
            })
        }

        // Obtenção de query params para paginação com valores padrão
        const limit = parseInt(req.query.limit as string, 10) || 10 // Número máximo de registros por página
        const page = parseInt(req.query.page as string, 10) || 1 // Número da página
        const offset = (page - 1) * limit

        // Consulta paginada
        const { rows: likedMoments, count: totalItems } = await Like.findAndCountAll({
            where: { user_id: user_id.toString() },
            limit,
            offset,
        })

        // Construção do objeto de paginação
        const totalPages = Math.ceil(totalItems / limit)

        res.status(200).json({
            data: likedMoments,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        })
    } catch (error) {
        console.error("Error fetching following users:", error)

        if (error instanceof ValidationError) {
            res.status(400).json({
                success: false,
                error: {
                    message: error.message,
                    action: error.action,
                },
            })
        }
    }
}
