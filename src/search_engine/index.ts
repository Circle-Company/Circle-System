import { find_search_candidates } from "./src/modules/find_search_candidates";
import { add_candidates_interactions } from "./src/modules/add_candidates_interactions";
import { apply_candidates_weights } from "./src/modules/apply_candidates_weights";
import { sort_candidates } from "./src/modules/sort_candidates";

type SearchEngineProps = {
    username_to_search: string;
    user_id: number;
};

/**
 * Main search engine function that orchestrates the search process.
 * @param {SearchEngineProps} props - Input properties containing user information and username to search.
 * @returns {Promise<any>} - A Promise that resolves to the sorted search candidates.
 */
export async function SearchEngine({
    user_id, 
    username_to_search
}: SearchEngineProps): Promise<any> {
    // Finding search candidates based on the provided user information and username
    const found_search_candidates = await find_search_candidates({
        user_id: user_id,
        username_to_search: username_to_search
    });

    // Adding interactions to the found search candidates
    const added_candidates_interactions = await add_candidates_interactions(found_search_candidates);

    // Applying weights to the candidates based on interactions
    const applied_candidates_weights = await apply_candidates_weights(added_candidates_interactions);

    // Sorting the candidates based on applied weights
    const sorted_candidates = await sort_candidates({ candidates: applied_candidates_weights });

    return sorted_candidates;
}