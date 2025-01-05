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

export function sort_candidates({ candidates_with_score }: any) {
    return candidates_with_score.sort((a: any, b: any) => b.score - a.score)
}
