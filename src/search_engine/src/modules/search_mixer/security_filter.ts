interface UserObject {
	id: number,
	username: string,
    name: string,
	verifyed: false,
    blocked: boolean,
	you_follow: boolean,
	profile_picture: {
		tiny_resolution: null | string
	},
    score: number
}

interface UserObjectReturn {
	id: number,
	username: string,
	verifyed: false,
	you_follow: boolean,
	profile_picture: {
		tiny_resolution: null | string
	},
    score: number
}

type SortCandidatesProps = {
    candidates: UserObject[]
}
export function security_filter({
    candidates
}: any){
    const users = candidates.map((candidate: any) => {
        if(candidate.blocked == true) return null
        else return {
            id:candidate.id,
            username: candidate.username,
            name: candidate.name,
            verifyed: candidate.verifyed,
            you_follow: candidate.you_follow,
            profile_picture: candidate.profile_picture,
        }
    })
    return users.filter((item: any) => item !== null)
}