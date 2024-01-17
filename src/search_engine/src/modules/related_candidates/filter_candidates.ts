interface UserObject {
    user: {
      username: string;
      user_id: number;
    };
    weight: number;
}

type SortCandidatesProps = {
    search_term: string,
    finded_candidates: UserObject[]
}
export async function filter_candidates({
    search_term, finded_candidates
}: SortCandidatesProps) {
    return finded_candidates.filter((item) => item.user.username.includes(search_term))
}