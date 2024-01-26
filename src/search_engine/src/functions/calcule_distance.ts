import { Coordinates, haversineDistance } from "../../../helpers/coordinates_distance"
type CalculeDistanceProps = {
    cords1: { latitude: number | null; longitude: number | null };
    cords2: { latitude: number | null; longitude: number | null };
};

export function calcule_distance({ cords1, cords2 }: CalculeDistanceProps) {
    // Check if either cords1 or cords2 is null
    if (cords1 === null || cords2 === null) {
        throw new Error("Coordinates cannot be null");
    }

    // Check if latitude and longitude are not null before creating Coordinates instances
    const user1_coords =
        cords1.latitude !== null && cords1.longitude !== null
            ? new Coordinates(cords1.latitude, cords1.longitude)
            : null;

    const user2_coords =
        cords2.latitude !== null && cords2.longitude !== null
            ? new Coordinates(cords2.latitude, cords2.longitude)
            : null;

    // Check if both user1_coords and user2_coords are not null before calculating distance
    if (user1_coords !== null && user2_coords !== null) {
        return haversineDistance(user1_coords, user2_coords);
    } else {
        throw new Error("Coordinates are incomplete or null");
    }
}