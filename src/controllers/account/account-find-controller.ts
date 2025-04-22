import { Request, Response } from "express"
import { ValidationError } from "../../errors"
import Follow from "../../models/user/follow-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model"
import User from "../../models/user/user-model"

export async function findAccountFollowings(req: Request, res: Response) {
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
            attributes: ["created_at"],
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

        // Converter IDs para string antes de retornar
        const filteredList = followingUsers.map((item: any) => {
            // Verificar se item.followers existe e tem id
            const followerId = item?.followers?.id
            return {
                id: followerId ? followerId.toString() : null, // Converter para string
                username: item?.followers?.username,
                verifyed: item?.followers?.verifyed,
                profile_picture: item?.followers?.profile_pictures,
                statistic: item?.followers?.statistics,
                followed_at: item?.created_at,
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
    } catch (error: any) {
        // Tipo 'any' para acessar propriedades como 'statusCode'
        console.error("Error fetching following users:", error)

        if (error instanceof ValidationError) {
            // Erro de validação conhecido (ex: user_id faltando)
            return res.status(error.statusCode || 400).json({
                message: error.message,
                action: error.action,
                key: error.key,
            })
        } else {
            // Outros erros (ex: erro de banco de dados)
            return res.status(500).json({
                message: "An internal server error occurred while fetching followings.",
                // Opcional: Adicionar error ID para rastreamento
                // errorId: (error instanceof BaseError) ? error.errorId : undefined
            })
        }
    }
}
