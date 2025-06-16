import { Op, and, col, fn, literal, where } from "sequelize"

import Coordinate from "../../models/user/coordinate-model"
import Follow from "../../models/user/follow-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import User from "../../models/user/user-model"
import { ValidationError } from "../../errors"

interface FindNearbyUsersParams {
    userID: bigint
    latitude: string | number
    longitude: string | number
    radius?: number | string
    limit?: number | string
}

interface UserWithRelations extends User {
    distance_km: string
    profile_pictures?: {
        tiny_resolution: string | null
    }
    statistics?: Array<{
        total_followers_num: number
    }>
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
                    attributes: ['tiny_resolution']
                }
            ],
            where: and(
                { id: { [Op.ne]: userID } },
                { deleted: false },
                { blocked: false }
            ),
            order: [[haversineFormula, 'ASC']],
            limit: limitValue
        }) as unknown as UserWithRelations[]

        // Buscar relacionamentos de follow
        const [youFollow, followYou] = await Promise.all([
            Follow.findOne({
                where: {
                    user_id: userID,
                    followed_user_id: { [Op.in]: nearbyUsers.map(user => user.id) }
                },
                attributes: ['followed_user_id']
            }),
            Follow.findOne({
                where: {
                    user_id: { [Op.in]: nearbyUsers.map(user => user.id) },
                    followed_user_id: userID
                },
                attributes: ['user_id']
            })
        ])

        // Formatar resultados
        const users = nearbyUsers.map(user => ({
            id: user.id.toString(),
            name: user.name,
            username: user.username,
            verifyed: user.verifyed,
            profile_picture: {tiny_resolution: user.profile_pictures?.tiny_resolution},
            distance_km: user.distance_km,
            you_follow: Boolean(youFollow?.followed_user_id === user.id),
            follow_you: Boolean(followYou?.user_id === user.id),
        }))

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