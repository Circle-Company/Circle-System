interface UserObject {
    id: bigint
    username: string
    verifyed: boolean
    name: string
    muted: boolean
    blocked: boolean
    profile_picture: {
        tiny_resolution: string
    }
    follow_you: boolean
    you_follow: boolean
    block_you: boolean
    distance: number
    statistic: {
        total_followers_num: number
    }
}
type SortCandidatesProps = {
    candidates_with_interactions: UserObject[]
}
export function calcule_score({ candidates_with_interactions }: any) {
    return candidates_with_interactions.map((candidate: any) => {
        const weights = require("../../database/unknown_candidates_weights.json")
        let totalScore = 0

        for (const criterion in weights) {
            if (candidate[criterion] !== undefined && weights[criterion].weight !== undefined) {
                totalScore += candidate[criterion] ? weights[criterion].weight : 0
            }
        }
        return {
            id: candidate.id,
            username: candidate.username,
            name: candidate.name,
            verifyed: candidate.verifyed,
            blocked: candidate.blocked,
            you_follow: false,
            follow_you: candidate.follow_you,
            profile_picture: candidate.profile_picture,
            statistic: candidate.statistic,
            score: totalScore,
        }
    })
}
