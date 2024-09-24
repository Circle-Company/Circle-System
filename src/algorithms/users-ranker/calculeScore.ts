export interface UserObject {
    [key: string]: any // Permite qualquer outra propriedade
    id: number
    verifyed: boolean
    muted: boolean
    block_you: boolean
    you_follow: boolean
    follow_you: boolean
    has_profile_picture: boolean
    total_followers_num: number
    distance: number
    relation_weight: number
    is_you: boolean
}

type SortCandidatesProps = {
    candidates: UserObject[]
}
export function calcule_score({ candidates }: SortCandidatesProps) {
    return candidates.map((candidate) => {
        const weights = require("./weights.json")
        let totalScore = candidate.weight

        for (const criterion in weights) {
            if (candidate[criterion] !== undefined && weights[criterion].weight !== undefined) {
                totalScore += candidate[criterion] ? weights[criterion].weight : 0
            }
        }
        return {
            ...candidate,
            score: totalScore,
        }
    })
}
