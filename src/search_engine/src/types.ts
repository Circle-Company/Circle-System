export type ApplyCandidatesWeights = {
    candidates: Array<CandidateProps>
}

export type SortCandidatesProps = {
    candidates: Array<CandidateWithWeights>
}

export type CandidateWithWeights = {
    id: number
    username: string
    verifyed: boolean
    name: string | null
    muted: boolean
    profilePicture: {
        fullhd_resolution: null | string
        tiny_resolution: null | string
    }
    follow_you: boolean
    you_follow: boolean
    distance: number | null
    total_followers_num: number
    total_score: number
}

export type CandidateProps = {
    id: number
    username: string
    verifyed: boolean
    name: string | null
    muted: boolean
    profilePicture: {
        fullhd_resolution: null | string
        tiny_resolution: null | string
    }
    follow_you: boolean
    you_follow: boolean
    distance: number | null
    total_followers_num: number
}

export type AddCandidatesInteractionsProps = {
    users: Array<UserProps>
    user_coordinates: {
        latitude: number
        longitude: number
    }
    user_id: number
}
export type UserProps = {
    id: number
    username: string
    verifyed: boolean
    name: null | string
    muted: boolean
    coordinates: {
        latitude: number
        longitude: number
    }
    profile_pictures: {
        fullhd_resolution: null | string
        tiny_resolution: null | string
    }
    statistics: {
        total_followers_num: number
    }
}

export type FindSearchCandidatesProps = {
    search_term: string
    user_id: bigint
}
