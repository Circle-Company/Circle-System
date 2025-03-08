import { getFeedCandidates } from "./getFeedCandidates"

export async function ModuleV2() {
    /**
    posts: 
    - embedding de post: 
    - - texto (descrição)
    - - tags (#tag1 #tag2)
    - - engajamento (n de likes, n de comentários etc)

    users:
    - - Array de engajamento medio dos posts vistos com mais peso para os mais recentes e com interaction_rate maior
    - - Tags dos posts mais interagidos também odenado por interaction_rate
    - - Texto dos 
    */
    /**
    functions: 
    - criar ou pegar a embedding do usuario
    - pegar similaridade entre embeddings dos posts das ultimas 48 horas, se tive menos que 100 pegar os ultimos 100
    - pegar posts (10 ultimos) de maior interação do usuario (interaction_rate) e 1 candidato por post (10) e pegar o de maior similaridade entre eles
    - get top 10 posts to send to user
    */

    async function getFeed(userId: number) {
        const initialCandidates = await getFeedCandidates(userId)
    }

    return {
        getFeed,
    }
}
