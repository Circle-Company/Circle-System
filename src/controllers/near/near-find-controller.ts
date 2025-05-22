import { Request, Response } from "express"

import { DatabaseError } from "sequelize"
import { NearService } from "../../services/near-service"
import { ValidationError } from "../../errors"

/**
 * Controlador para buscar usuários próximos.
 * Este controlador é responsável por receber os parâmetros da requisição,
 * validar a autenticação do usuário e delegar a lógica de negócio para o serviço.
 */
export async function findNearbyUsers(req: Request, res: Response) {
    try {
        // Validar autenticação
        if (!req.user_id) {
            throw new ValidationError({
                message: "ID do usuário é necessário para buscar usuários próximos.",
                action: "Certifique-se de que o usuário está autenticado.",
                type: "AUTHENTICATION_REQUIRED"
            })
        }

        // Extrair parâmetros, verificando body, query e params
        const lat = req.body.latitude || req.query.latitude || req.params.latitude
        const lng = req.body.longitude || req.query.longitude || req.params.longitude
        const radius = req.query.radius || req.body.radius
        const limit = req.query.limit || req.body.limit

        // Verificar se latitude e longitude foram fornecidos
        if (!lat || !lng) {
            throw new ValidationError({
                message: "Latitude e longitude são obrigatórios.",
                action: "Forneça os parâmetros latitude e longitude.",
                type: "MISSING_COORDINATES"
            })
        }

        // Chamar o serviço para buscar usuários próximos
        const result = await NearService.FindNearbyUsers({
            userID: req.user_id,
            latitude: lat,
            longitude: lng,
            radius,
            limit
        })

        // Retornar resultados
        res.status(200).json(result)

    } catch (error) {
        console.error("Erro ao buscar usuários próximos:", error)

        if (error instanceof ValidationError) {
            return res.status(400).json({
                error: {
                    message: error.message,
                    action: error.action,
                    type: error.type
                }
            })
        } else if (error instanceof DatabaseError) {
            return res.status(500).json({
                error: {
                    message: "Erro no banco de dados ao buscar usuários próximos.",
                    type: "DATABASE_ERROR"
                }
            })
        } else {
            return res.status(500).json({
                error: {
                    message: "Erro interno ao buscar usuários próximos.",
                    type: "INTERNAL_SERVER_ERROR"
                }
            })
        }
    }
} 