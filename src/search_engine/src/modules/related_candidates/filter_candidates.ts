import { max_premium_users_per_page, max_results_per_page } from "../../database/rules.json"
import { RelatedUserProps } from "../../types"

type SortCandidatesProps = {
    search_term: string
    finded_candidates: RelatedUserProps[]
}
export function filter_candidates({ search_term, finded_candidates }: SortCandidatesProps) {
    const idsSet = new Set<bigint>()
    const uniqueUsers: RelatedUserProps[] = []

    // Remove usuários duplicados
    for (const user of finded_candidates) {
        if (!idsSet.has(user.user.user_id)) {
            idsSet.add(user.user.user_id)
            uniqueUsers.push(user)
        }
    }

    let candidates_without_duplication = uniqueUsers
    let filtered_premium_candidates = candidates_without_duplication.filter(
        (item) => item.is_premium
    )
    let filtered_non_premium_candidates = candidates_without_duplication.filter(
        (item) => !item.is_premium
    )

    if (filtered_premium_candidates.length > max_premium_users_per_page) {
        const top_premium_candidates = filtered_premium_candidates.sort(
            (a, b) => b.weight - a.weight
        )
        filtered_premium_candidates = top_premium_candidates.slice(0, max_premium_users_per_page)
    }

    const filtered_candidates = [...filtered_premium_candidates, ...filtered_non_premium_candidates]
    const sorted_filtered_candidates = filtered_candidates.sort((a, b) => b.weight - a.weight)
    const filtered_candidates_with_search_term = sorted_filtered_candidates.filter((item) =>
        item.user.username.includes(search_term)
    )

    return filtered_candidates_with_search_term.slice(0, max_results_per_page)
}
