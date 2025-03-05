export interface GenerateRecommendationsProps {
    interaction_queue: InteractionQueueProps
}

export interface InteractionQueueProps {
    user_id: number,
    length: number,
    period: number,
    data: MomentInteractionProps[]
}

export interface MomentInteractionProps {
    id: number,
    userId: number,
    tags: TagsProps[],
    duration: number,
    type: "IMAGE" | "VIDEO",
    language: "pt-br" | "en",
    interaction: InteractionProps
}

interface InteractionProps {
    liked: boolean,
    shared: boolean,
    clickIntoMoment: boolean,
    watchTime: number,
    clickProfile: boolean,
    commented: boolean,
    likeComment: boolean,
    skipped: boolean,
    showLessOften: boolean,
    reported: boolean
}

export interface TagsProps {
    id: number,
    name: string
}