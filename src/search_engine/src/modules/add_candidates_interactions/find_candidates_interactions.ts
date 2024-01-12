import { Coordinates, haversineDistance } from "../../../../helpers/coordinates_distance";
import { UserProps } from "../../types";
import Candidate from "../../classes/candidate";

import { setUserFollowed } from "../../functions/set_interactions/ser_user_followed";
import { setUserBlocked } from "../../functions/set_interactions/set_user_blocked";
import { setUserFollowing } from "../../functions/set_interactions/set_user_following";
/**
 * Filters the search candidates based on interactions and distance.
 * @param {UserProps[]} users - List of candidates.
 * @param {Coordinates} user_coordinates - User's coordinates.
 * @param {number} user_id - ID of the user.
 * @returns {Promise<Candidate[]>} - A Promise that resolves to the filtered candidates.
 */
export async function findCandidatesInteractions(users: UserProps[], user_coordinates: Coordinates, user_id: number): Promise<Candidate[]> {
    const result = await Promise.all(
        users.map(async (user: UserProps) => {
            // Check if the user follows the candidate
            const user_followed = await setUserFollowed(user_id, user);
            const user_following = await setUserFollowing(user_id, user);

            // Check if the user is blocked by the candidate
            const user_blocked = await setUserBlocked(user_id, user);

            // If the user is blocked by the candidate, skip the candidate
            if (user_blocked === null) return null;

            const user_cords = new Coordinates(
                user_coordinates.latitude,
                user_coordinates.longitude
            );
            const compared_user_cords = new Coordinates(
                user.coordinates.latitude,
                user.coordinates.longitude
            );

            // Calculates the distance between the user coordinates and the candidate
            const distance = haversineDistance(user_cords, compared_user_cords);

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
                user_following, // Check if the user follows the candidate
                user_blocked,
                distance,
                user.statistics.total_followers_num
            );
        })
    );

    // Clean possible null objects from the array
    return result.filter((candidate): candidate is Candidate => candidate !== null);
}