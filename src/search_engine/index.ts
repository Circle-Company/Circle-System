import { find_search_candidates } from "./src/modules/find_search_candidates"
import { add_candidates_interactions } from "./src/modules/add_candidates_interactions"
import { apply_candidates_weights } from "./src/modules/apply_candidates_weights"
import { sort_candidates } from "./src/modules/sort_candidates"

type SearchEngineProps = {
    username_to_search: string,
    user_id: number
}

export async function SearchEngine({
    user_id, username_to_search
} : SearchEngineProps) {
    /**
     * 1 - search the 20 candidates based on the search term.
     * 2 - looks for the interactions of these 20 candidates with the user
     * 3 - adds weights to these interactions and calculates the total_score for each user
     * 4 - Sort the array based on each user total_score and filters the data that will
           be passed to the client
    **/

    const finded_search_candidates = await find_search_candidates({
        user_id: user_id,
        username_to_search: username_to_search
    }) 
    const added_candidates_interactions = await add_candidates_interactions(finded_search_candidates)
    const applyed_candidates_weights = await apply_candidates_weights(added_candidates_interactions)
    const sorted_candidates = await sort_candidates({candidates: applyed_candidates_weights})

    return sorted_candidates
}