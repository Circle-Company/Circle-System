interface UserObject {
    user: {
      username: string;
      user_id: number;
    };
    weight: number;
}

type SortCandidatesProps = {
    search_term: string,
    candidates_without_duplication: UserObject[]
}
export async function filter_candidates({
    search_term, candidates_without_duplication
}: SortCandidatesProps) {
    return candidates_without_duplication.filter((item) => item.user.username.includes(search_term))
}