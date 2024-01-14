import { findInitCandidates } from "./modules/generate_user_follows_graph/find_init_candidates";
import { generateUserFollowsGraph } from "./modules/generate_user_follows_graph";
type UserRecommenderProps = {
    user_id: number;
};

/**
 * Main user recommender engine function that orchestrates the user recommendation process.
 * @param {UserRecommenderProps} props - Input properties containing user id
 * @returns {Promise<any>} - A Promise that resolves to the sorted recommender candidates.
 */
export async function UserRecommenderEngine({
    user_id, 
}: UserRecommenderProps): Promise<any> {

    const init_candidates = await generateUserFollowsGraph({ user_id})

    return init_candidates
    
}