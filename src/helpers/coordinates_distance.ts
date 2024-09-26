export class Coordinates {
    constructor(public latitude: number, public longitude: number) {}
}

export function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
    if (coord1.latitude == null || coord1.longitude == null)
        throw new Error("coord1 can not be null")
    else if (coord2.latitude == null || coord2.longitude == null)
        throw new Error("coord2 can not be null")
    else {
        const R = 6371 // Raio médio da Terra em quilômetros
        const dLat = toRadians(coord2.latitude - coord1.latitude)
        const dLon = toRadians(coord2.longitude - coord1.longitude)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(coord1.latitude)) *
                Math.cos(toRadians(coord2.latitude)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c // Distância em quilômetros
        return distance
    }
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
}
