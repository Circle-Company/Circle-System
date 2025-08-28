import { calcule_score } from "./calcule_score"
import { complete_candidates_informations } from "./complete_candidates_informations"
import { filter_candidates } from "./filter_candidates"
import { find_candidates } from "./find_candidates"

type RelatedCandidatesProps = {
    user_id: bigint
    search_term: string
}

export async function related_candidates({ user_id, search_term }: RelatedCandidatesProps) {
    const finded_candidates = await find_candidates({ user_id })
    const filtered_candidates = filter_candidates({
        search_term,
        finded_candidates,
    })
    const candidates_with_informations = await complete_candidates_informations({
        filtered_candidates,
        user_id,
    })
    return calcule_score({ candidates_with_informations })
}
