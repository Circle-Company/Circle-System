interface UserObject {
	id: number,
	username: string,
	verifyed: false,
    blocked: boolean,
	you_follow: boolean,
	profile_picture: {
		tiny_resolution: null | string
	},
    score: number
}

type SortCandidatesProps = {
    candidates_with_score: UserObject[]
}
export async function sort_candidates({
    candidates_with_score
}: any) {
    return candidates_with_score.sort((a:any, b:any) => b.score - a.score)
}