import { findInitCandidates } from "./modules/generate_user_follows_graph/find_init_candidates";
import { generateUserFollowsGraph } from "./modules/generate_user_follows_graph";
type WTFProps = {
    user_id: number;
};

/**
 * Main user recommender engine function that orchestrates the user recommendation process.
 * @param {WTFProps} props - Input properties containing user id
 * @returns {Promise<any>} - A Promise that resolves to the sorted recommender candidates.
 */
export async function WTF({
    user_id, 
}: WTFProps): Promise<any> {

    const init_candidates = await generateUserFollowsGraph({ user_id})

    return init_candidates
    
}