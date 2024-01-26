interface UserObject {
	id: number,
	username: string,
	verifyed: false,
    blocked: boolean,
	you_follow: boolean,
	profile_picture: {
		tiny_resolution: null | string
	},
	statistic: {
		total_followers_num: number
	}
    score: number
}

type SortCandidatesProps = {
    candidates_with_score: UserObject[]
}
export function sort_candidates({
    candidates_with_score
}: any) {
    return candidates_with_score.sort((a:any, b:any) => b.score - a.score)
}