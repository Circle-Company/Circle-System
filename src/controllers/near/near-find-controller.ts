import { Request, Response } from "express"

import { DatabaseError } from "sequelize"
import { NearService } from "../../services/near-service"
import { ValidationError, PaymentRequiredError } from "../../errors"
import { premiumValidation } from "../../middlewares/premium-validation"
import { UserFactory } from "../../classes/user/UserFactory"

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

        // Carregar dados do usuário se não estiver carregado
        if (!req.user) {
            req.user = await UserFactory.createUser(req.user_id)
        }

        // Verificar se pode usar busca por localização (feature premium)
        const canUseLocationSearch = await req.user.canAccessFeature('location_search')
        if (!canUseLocationSearch) {
            throw new PaymentRequiredError({
                message: "Location-based search requires premium subscription",
                action: "Upgrade to Premium to find users near you",
                renewal_url: "/upgrade-premium"
            })
        }

        // Track feature usage
        await req.user.trackFeatureUsage('location_search')

        // Extrair parâmetros, verificando body, query e params
        const lat = req.body.latitude || req.query.latitude || req.params.latitude
        const lng = req.body.longitude || req.query.longitude || req.params.longitude
        let radius = req.query.radius || req.body.radius
        let limit = req.query.limit || req.body.limit

        // Aplicar limites baseados no tier do usuário
        const maxRadius = req.user.subscriptionTier === 'premium' ? 100 : 10 // km
        const maxLimit = req.user.subscriptionTier === 'premium' ? 100 : 20

        radius = Math.min(radius || 5, maxRadius)
        limit = Math.min(limit || 10, maxLimit)

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