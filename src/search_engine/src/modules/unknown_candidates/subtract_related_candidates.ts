import { filterSearchParams } from "../../functions/filter_search_params"
type SubtractRelatedCandidatesProps = {
    related_candidates_list: any,
    finded_candidates: any
}
export async function subtract_related_candidates({
    related_candidates_list,
    finded_candidates
}: SubtractRelatedCandidatesProps){
    const idSet1 = new Set(related_candidates_list.map((user: any) => user.id));
    return await finded_candidates.filter((user: any) => !idSet1.has(user.id));
}