interface UserObject {
    id: bigint
    username: string
    verifyed: false
    blocked: boolean
    you_follow: boolean
    profile_picture: {
        tiny_resolution: null | string
    }
    statistic: {
        total_followers_num: number
    }
    score: number
}

type SortCandidatesProps = {
    candidates_with_score: UserObject[]
}
export async function sort_candidates({ candidates_with_score }: SortCandidatesProps) {
    return candidates_with_score.sort((a, b) => b.score - a.score)
}
