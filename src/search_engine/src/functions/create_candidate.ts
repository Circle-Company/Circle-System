import Candidate from "../classes/candidate";
import { UserProps } from "../types";
import { Coordinates, haversineDistance } from "../../../helpers/coordinates_distance";

/**
 * Creates a new Candidate object with interactions details.
 * @param {UserProps} user - User details.
 * @param {number} user_id - ID of the user.
 * @param {Coordinates} user_coordinates - User's coordinates.
 * @param {boolean} user_followed - Indicates if the user follows the candidate.
 * @param {boolean} user_following - Indicates if the user is followed by the candidate.
 * @param {boolean} user_blocked - Indicates if the user is blocked by the candidate.
 * @param {number} distance - Distance between user coordinates and candidate.
 * @returns {Candidate | null} - The created Candidate object or null if blocked.
 */
export function createCandidate(
    user: UserProps,
    user_id: number,
    user_coordinates: Coordinates,
    user_followed: boolean,
    user_following: boolean,
    user_blocked: boolean,
    distance: number
): Candidate | null {
    // If the user is blocked by the candidate, skip the candidate
    if (user_blocked) return null;

    const user_cords = new Coordinates(
        user_coordinates.latitude,
        user_coordinates.longitude
    );
    const compared_user_cords = new Coordinates(
        user.coordinates.latitude,
        user.coordinates.longitude
    );

    // Calculates the distance between the user coordinates and the candidate
    const calculatedDistance = haversineDistance(user_cords, compared_user_cords);

    return new Candidate(
        user.id,
        user.username,
        user.verifyed,
        user.name,
        user.muted,
        {
            fullhd_resolution: user.profile_pictures.fullhd_resolution,
            tiny_resolution: user.profile_pictures.tiny_resolution
        },
        user_followed,
        user_following,
        user_blocked,
        calculatedDistance,
        user.statistics.total_followers_num
    );
}