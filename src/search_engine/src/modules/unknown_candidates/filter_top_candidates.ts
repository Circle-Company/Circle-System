type FilterTopCandidatesProps = {
    sorted_candidates: any,
    count: number
}

export function filter_top_candidates({
    sorted_candidates, count
}: FilterTopCandidatesProps) {
    return sorted_candidates.slice(0, count)
}