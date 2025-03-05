import { getFeedCandidates } from "./getFeedCandidates";

export async function ModuleV2() {
    /**
    posts: 
    - embedding de post: 
    - - texto
    - - tags
    - - engajamento 
    */
    /**
    functions: 
    - criar ou pegar a embedding do usuario
    - pegar similaridade entre embeddings dos posts das ultimas 48 horas, se tive menos que 100 pegar os ultimos 100
    - 
    - get top 10 posts to send to user
    */

    async function getFeed(userId: number) {
        const initialCandidates = await getFeedCandidates(userId)

    }

    return {
        getFeed
    }
}
