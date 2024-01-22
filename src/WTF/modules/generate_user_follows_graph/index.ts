import { findInitCandidates } from "./find_init_candidates"
import * as graphlib from 'graphlib'
import { createWeightedGraph } from "./create_graph"

type GenerateUserFollowsGraphProps = {
    user_id: number
}

export async function generateUserFollowsGraph({
    user_id
}:GenerateUserFollowsGraphProps) {

    const graph = new graphlib.Graph({ directed: true });

    const created_graph = createWeightedGraph({ user_id})
        .then((dotGraph) => console.log(dotGraph))
        .catch((error) => console.error('Erro:', error));
    console.log(`${created_graph}`)
    return created_graph
    
}