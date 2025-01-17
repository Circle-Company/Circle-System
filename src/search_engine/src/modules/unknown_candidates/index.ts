import { add_candidates_interactions } from "./add_candidates_interactions"
import { calcule_score } from "./calcule_score"
import { filter_top_candidates } from "./filter_top_candidates"
import { find_candidates } from "./find_candidates"
import { sort_candidates } from "./sort_candidates"
import { subtract_related_candidates } from "./subtract_related_candidates"

type UnknownCandidatesProps = {
    user_id: bigint
    search_term: string
    related_candidates_list: any[]
}

export async function unknown_candidates({
    search_term,
    user_id,
    related_candidates_list,
}: UnknownCandidatesProps) {
    const finded_candidates = await find_candidates({ search_term, user_id })
    const subtracted_candidates = await subtract_related_candidates({
        finded_candidates,
        related_candidates_list,
    })
    const candidates_with_interactions = await add_candidates_interactions({
        user_id,
        subtracted_candidates,
    })
    const candidates_with_score = calcule_score({ candidates_with_interactions })
    const sorted_candidates = sort_candidates({ candidates_with_score })
    const top_candidates = filter_top_candidates({ sorted_candidates, count: 20 })
    return top_candidates
}
