import { ReturnUserProps } from "search_engine/src/types"

export function security_filter({ candidates }: any): ReturnUserProps[] {
    const users = candidates.map((candidate: any) => {
        if (candidate.blocked == true) return null
        else
            return {
                id: candidate.id,
                username: candidate.username,
                name: candidate.name,
                verifyed: candidate.verifyed,
                you_follow: candidate.you_follow,
                statistic: candidate.statistic,
                profile_picture: candidate.profile_picture,
            }
    })
    return users.filter((item: any) => item !== null)
}
