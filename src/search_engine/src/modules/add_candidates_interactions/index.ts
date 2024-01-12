import { Coordinates, haversineDistance } from "../../../../helpers/coordinates_distance"
import { AddCandidatesInteractionsProps, UserProps} from "../../types"
import Candidate from "../../classes/candidate"
import { findCandidatesInteractions } from "./find_candidates_interactions"

/**
 * Adds interactions to the search candidates and filters the results.
 * @param {AddCandidatesInteractionsProps} props - Parameters for the interactions and filtering process.
 * @returns {Promise<{ candidates: Candidate[] }>} - A Promise that resolves to the filtered candidates.
 */
export async function add_candidates_interactions({
    users,
    user_coordinates,
    user_id
}: AddCandidatesInteractionsProps): Promise<{ candidates: Candidate[] }> {
    try {
        // Centralize the interactions checking and filtering process
        const candidates = await findCandidatesInteractions(users, user_coordinates, user_id);

        return { candidates };
    } catch (error) {
        // Handle errors gracefully and log them
        console.error("Error in add_candidates_interactions:", error);
        throw error; // Rethrow the error to be caught by the calling function
    }
}