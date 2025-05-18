import { Op, and, literal, where } from "sequelize"

import Coordinate from "../../models/user/coordinate-model"
import Follow from "../../models/user/follow-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model"
import User from "../../models/user/user-model"
import { ValidationError } from "../../errors"

interface FindNearbyUsersParams {
    userID: bigint
    latitude: string | number
    longitude: string | number
    radius?: number | string
    limit?: number | string
}

/**
 * Valida e normaliza as coordenadas geográficas
 */
function validateCoordinates(latitude: string | number, longitude: string | number): { lat: number, lng: number } {
    // Remove espaços em branco e converte para string para tratamento uniforme
    const latStr = String(latitude).trim()
    const lngStr = String(longitude).trim()

    // Verifica se as strings estão vazias
    if (!latStr || !lngStr) {
        throw new ValidationError({
            message: "Coordenadas não fornecidas.",
            action: "Forneça valores válidos para latitude e longitude.",
            type: "MISSING_COORDINATES"
        })
    }

    // Tenta converter para número
    const lat = parseFloat(latStr.replace(',', '.'))
    const lng = parseFloat(lngStr.replace(',', '.'))

    if (isNaN(lat) || isNaN(lng)) {
        throw new ValidationError({
            message: "Coordenadas inválidas.",
            action: "Forneça latitude e longitude como números válidos. Use ponto ou vírgula como separador decimal.",
            type: "INVALID_COORDINATES"
        })
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new ValidationError({
            message: "Coordenadas fora do intervalo válido.",
            action: "Latitude deve estar entre -90 e 90, longitude entre -180 e 180.",
            type: "COORDINATES_OUT_OF_RANGE"
        })
    }

    return { lat, lng }
}

/**
 * Valida e normaliza o raio de busca
 */
function validateRadius(radius: any, maxRadius: number = 100): number {
    const searchRadiusKm = radius ? parseFloat(radius) : 50 // Default 50km

    if (isNaN(searchRadiusKm) || searchRadiusKm <= 0) {
        throw new ValidationError({
            message: "Raio de busca inválido.",
            action: "O raio deve ser um número positivo em quilômetros.",
            type: "INVALID_RADIUS"
        })
    }

    return Math.min(searchRadiusKm, maxRadius)
}

/**
 * Formata os dados de usuário para o padrão desejado
 */
async function formatUserData(users: any[], userID: bigint): Promise<any[]> {
    if (!users.length) return []
    
    try {
        // Extrair IDs dos usuários encontrados
        const userIds = users.map(user => 
            (typeof user.get === 'function' ? user.get({ plain: true }) : user).id
        )
        
        // Buscar relacionamentos de follow em uma única query para cada tipo
        const [youFollowRelations, followYouRelations] = await Promise.all([
            // Quem o usuário logado segue
            Follow.findAll({
                where: {
                    user_id: userID,
                    followed_user_id: { [Op.in]: userIds }
                },
                attributes: ['followed_user_id']
            }),
            // Quem segue o usuário logado
            Follow.findAll({
                where: {
                    user_id: { [Op.in]: userIds },
                    followed_user_id: userID
                },
                attributes: ['user_id']
            })
        ])
        
        // Criar Sets para lookup mais rápido
        const youFollowSet = new Set(
            youFollowRelations.map(relation => 
                relation.get('followed_user_id').toString()
            )
        )
        
        const followYouSet = new Set(
            followYouRelations.map(relation => 
                relation.get('user_id').toString()
            )
        )

        // Mapear usuários para o formato desejado
        return users.map(user => {
            const userData = typeof user.get === 'function' ? user.get({ plain: true }) : user
            if (userData.deleted || userData.blocked) return null

            const userIdStr = userData.id.toString()
            
            return {
                id: userIdStr,
                name: userData.name,
                username: userData.username,
                verifyed: Boolean(userData.verifyed),
                profile_picture: {
                    tiny_resolution: userData.profile_pictures?.[0]?.tiny_resolution || null
                },
                distance_km: parseFloat(parseFloat(userData.distance_km).toFixed(1)),
                you_follow: youFollowSet.has(userIdStr),
                follow_you: followYouSet.has(userIdStr),
                statistic: userData.statistics?.[0] ? {
                    total_followers_num: userData.statistics[0].total_followers_num || 0
                } : undefined
            }
        }).filter(Boolean)
    } catch (error) {
        console.error('Erro ao formatar dados de usuários:', error)
        return []
    }
}

/**
 * Serviço de busca de usuários próximos
 */
export async function findNearbyUsersService({ 
    userID,
    latitude, 
    longitude, 
    radius, 
    limit 
}: FindNearbyUsersParams) {
    // Validar e normalizar parâmetros
    const coordinates = validateCoordinates(latitude, longitude)
    const searchRadiusKm = validateRadius(radius, 100000)
    const limitValue = limit ? parseInt(limit.toString()) : 7

    // Construir query de busca espacial com Haversine usando literal SQL
    const haversineFormula = literal(`
        ROUND(
            6371 * ACOS(
                LEAST(1, GREATEST(-1,
                    COS(RADIANS(${coordinates.lat})) * 
                    COS(RADIANS(coordinates.latitude)) * 
                    COS(RADIANS(coordinates.longitude) - RADIANS(${coordinates.lng})) + 
                    SIN(RADIANS(${coordinates.lat})) * 
                    SIN(RADIANS(coordinates.latitude))
                ))
            ), 1
        )
    `)

    try {
        // Buscar usuários próximos
        const nearbyUsers = await User.findAll({
            attributes: [
                'id',
                'username',
                'name',
                'verifyed',
                [haversineFormula, 'distance_km']
            ],
            include: [
                {
                    model: Coordinate,
                    as: 'coordinates',
                    required: true,
                    attributes: ['latitude', 'longitude'],
                    where: where(haversineFormula, '<=', searchRadiusKm)
                },
                {
                    model: ProfilePicture,
                    as: 'profile_pictures',
                    required: false,
                    attributes: ['tiny_resolution']
                },
                {
                    model: Statistic,
                    as: 'statistics',
                    required: false,
                    attributes: ['total_followers_num']
                }
            ],
            where: and(
                { id: { [Op.ne]: userID } },
                { deleted: false },
                { blocked: false }
            ),
            order: [[haversineFormula, 'ASC']],
            limit: limitValue
        })

        // Formatar dados dos usuários com informações de follow
        const users = await formatUserData(nearbyUsers, userID)

        // Retornar resultados formatados
        return {
            users,
            searchParams: {
                center: { latitude: coordinates.lat, longitude: coordinates.lng },
                radius: searchRadiusKm,
                total: users.length,
                limit: limitValue
            }
        }
    } catch (error) {
        console.error('Erro ao buscar usuários próximos:', error)
        throw error
    }
} 