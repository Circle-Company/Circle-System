export type ApplyCandidatesWeights = {
    candidates: Array<CandidateProps>
}

export type SortCandidatesProps = {
    candidates: Array<CandidateWithWeights>
}

export type FindedCandidatesProps = {
    user: {
        username: string
        user_id: bigint
    }
    weight: number
    is_premium: boolean
}

export interface HidratedCandidateProps {
    id: bigint
    username: string
    name: string
    verifyed: false
    muted: boolean
    blocked: boolean
    you_follow: boolean
    profile_picture: {
        tiny_resolution: null | string
    }
    statistic: {
        total_followers_num: number
    }
    weight: number
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
    is_premium: boolean
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
    is_premium: boolean
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

export type RelationProps = {
    id: number
    user_id: bigint
    related_user_id: bigint
    weight: number
}

export type RelatedUserProps = {
    user: {
        username: string
        user_id: bigint
    }
    is_premium: boolean
    weight: number
}

export type ReturnUserProps = {
    id: bigint
    username: string
    verifyed: boolean
    name: null | string
    profile_picture: {
        tiny_resolution: null | string
    }
    statistics: {
        total_followers_num: number
    }
    you_follow: boolean
}

export type CalculeDistanceProps = {
    cords1: { latitude: number | null; longitude: number | null };
    cords2: { latitude: number | null; longitude: number | null };
};

export type FindSearchCandidatesProps = {
    search_term: string
    user_id: bigint
}

export type SearchEngineProps = {
    searchTerm: string
    userId: bigint
}

export type SearchMixerProps = {
    user_id: bigint
    search_term: string
}
