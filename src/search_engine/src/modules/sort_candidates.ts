import { SortCandidatesProps } from "../types"

export async function sort_candidates({
    candidates
}: SortCandidatesProps) {
    // Sort candidates based on totalScore (descending order)
    const sorted_candidates = candidates.sort((a, b) => {
        if (a.total_score < b.total_score) return 1
        if (a.total_score > b.total_score) return -1
        return 0
    })

    // filters the data so that only the data used for render component is sent to the client
    const filtered_candidates = sorted_candidates.map((candidate) => {
        return {
            id: candidate.id,
            username: candidate.username,
            verifyed: candidate.verifyed,
            name: candidate.name,
            you_follow: candidate.you_follow,
            total_followers_num: candidate.total_followers_num,
            profile_picture: candidate.profilePicture,
        }
    })
    return filtered_candidates     
}