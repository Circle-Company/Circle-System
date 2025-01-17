import { Op } from "sequelize"
import { InternalServerError } from "../errors"
import { haversineDistance } from "../math/haversineDistance"
import Coordinates from "../models/user/coordinate-model" // Modelo Sequelize para a tabela 'coordinates'
import { UserProps } from "../search_engine/src/types"

export type LocationServiceProps = {
    user: UserProps
    radiusInKm: number
}

export async function LocationService({
    user,
    radiusInKm,
}: LocationServiceProps): Promise<UserProps[]> {
    const RADIUS_OF_EARTH_KM = 6371 // Raio da Terra em km

    // Cálculo de latitude e longitude máxima e mínima para o raio
    const latDelta = radiusInKm / RADIUS_OF_EARTH_KM
    const lonDelta =
        radiusInKm / (RADIUS_OF_EARTH_KM * Math.cos((user.coordinates.latitude * Math.PI) / 180))

    const minLat = user.coordinates.latitude - latDelta
    const maxLat = user.coordinates.latitude + latDelta
    const minLon = user.coordinates.longitude - lonDelta
    const maxLon = user.coordinates.longitude + lonDelta

    // Query no banco de dados para buscar coordenadas dentro do bounding box
    const nearbyCoordinates = await Coordinates.findAll({
        where: {
            latitude: {
                [Op.between]: [minLat, maxLat],
            },
            longitude: {
                [Op.between]: [minLon, maxLon],
            },
        },
        attributes: ["user_id", "latitude", "longitude"],
    })

    // Filtrar os resultados para garantir que estão dentro do raio usando Haversine
    const nearbyUsers: any = nearbyCoordinates
        .map((coord) => {
            if (!coord.latitude || !coord.longitude)
                throw new InternalServerError({
                    message: "Latitude or longitude coordinates is missing.",
                })
            const distance = haversineDistance(
                user.coordinates.latitude,
                user.coordinates.longitude,
                coord.latitude,
                coord.longitude
            )

            return {
                ...coord.toJSON(),
                distance,
            }
        })
        .filter((coord) => coord.distance <= radiusInKm) // Garantir que está dentro do raio
        .sort((a, b) => a.distance - b.distance) // Ordenar por proximidade
        .slice(0, 10) // Pegar os 10 mais próximos

    return nearbyUsers
}

// Exemplo de uso
;(async () => {
    const currentUser: UserProps = {
        id: 1,
        username: "currentUser",
        verifyed: true,
        name: "User Name",
        muted: false,
        coordinates: {
            latitude: 40.7128,
            longitude: -74.006,
        },
        profile_pictures: {
            fullhd_resolution: null,
            tiny_resolution: null,
        },
        statistics: {
            total_followers_num: 100,
        },
    }

    const radius = 1 // Defina o raio desejado em km
    const nearbyUsers = await LocationService({ user: currentUser, radiusInKm: radius })
    console.log(nearbyUsers)
})()
