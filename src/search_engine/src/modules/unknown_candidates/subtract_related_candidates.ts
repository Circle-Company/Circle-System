import { filterSearchParams } from "../../functions/filter_search_params"
type SubtractRelatedCandidatesProps = {
    related_candidates_list: any,
    finded_candidates: any
}
export function subtract_related_candidates({
    related_candidates_list,
    finded_candidates
}: SubtractRelatedCandidatesProps){
    // Criar um conjunto (Set) contendo os IDs da primeira lista
    const idSet1 = new Set(related_candidates_list.map((user: any) => user.id));

    // Filtrar a segunda lista, mantendo apenas os usuários que não estão na primeira lista
    const result = finded_candidates.filter((user: any) => !idSet1.has(user.id));
  
    return result
}