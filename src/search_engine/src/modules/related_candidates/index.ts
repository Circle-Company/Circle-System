import { calcule_score } from "./calcule_score"
import { complete_candidates_informations } from "./complete_candidates_informations"
import { filter_candidates } from "./filter_candidates"
import { find_candidates } from "./find_candidates"
import { sort_candidates } from "./sort_candidates"
import { remove_duplicates } from "./remove_duplicates"

type RelatedCandidatesProps = {
    user_id: number,
    search_term: string
}

export async function related_candidates({
    user_id,search_term
}: RelatedCandidatesProps) {
    const finded_candidates = await find_candidates({user_id})
    const candidates_without_duplication = await remove_duplicates({finded_candidates})
    const filtered_candidates = await filter_candidates({search_term, candidates_without_duplication})
    const candidates_with_informations = await complete_candidates_informations({filtered_candidates, user_id})
    const candidates_with_score = calcule_score({candidates_with_informations})
    return await sort_candidates({candidates_with_score})
}