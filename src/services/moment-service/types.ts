export interface MomentProps {
    id: number
    description: string
    midia: MidiaProps
    metadata: MetadataProps
    tags: TagProps[]
    statistic: StatisticProps
    visible?: boolean
    blocked?: boolean
    deleted?: boolean
}

export interface NewMomentProps {
    id: number
    description: string
    midia: {
        content_type: "IMAGE" | "VIDEO"
        base64: string
    }
    metadata: MetadataProps
    tags: TagProps[]
    statistic: StatisticProps
}

export interface StatisticProps {
    is_trend: boolean
    total_likes_num: number
    total_views_num: number
    total_shares_num: number
    total_reports_num: number
    total_skips_num: number
    total_comments_num: number
    total_profile_clicks_num: number
}

export interface MetadataProps {
    duration: number
    file_name: string
    file_size: number
    file_type: "image/png" | "image/heic" | "image/jpg"
    resolution_width: number
    resolution_height: number
}
export interface TagProps {
    title: string
}
export interface MidiaProps {
    content_type: "IMAGE" | "VIDEO"
    fullhd_resolution: string
    nhd_resolution: string
}

export interface CommentProps {
    user_id: string
    content: string
}

export interface InteractionQueueProps {
    user_id: number
    length: number
    period: number
    data: MomentInteractionProps[]
}

export interface MomentInteractionProps {
    id: number
    user_id: number
    tags: TagsProps[]
    duration: number
    type: "IMAGE" | "VIDEO"
    language: "pt-br" | "en"
    interaction: InteractionProps
}

interface InteractionProps {
    like: boolean
    share: boolean
    click_into_moment: boolean
    watch_time: number
    click_profile: boolean
    comment: boolean
    like_comment: boolean
    pass_to_next: boolean
    show_less_often: boolean
    report: boolean
}

export interface TagsProps {
    id: number
    name: string
}

export interface FindUserFeedMomentsProps {
    interaction_queue: InteractionQueueProps
}

export interface FindUserMomentsProps {
    page: number
    pageSize: number
    user_id: number
    finded_user_pk: number
}

export interface FindUserMomentsTinyExcludeMemoryProps {
    memory_id: number
    user_id: number
}

export interface FindMomentTagsProps {
    moment_id: number
}

export interface FindMomentStatisticsViewProps {
    moment_id: number
}

export interface StoreNewMomentsProps {
    user_id: number
    moment: NewMomentProps
}

export interface CommentOnMomentProps {
    moment_id: number
    user_id: number
    content: string
    page: number
    pageSize: number
}

export interface ReplyCommentOnMomentProps {
    moment_id: number
    user_id: number
    parent_comment_id: number
    content: string
    page: number
    pageSize: number
}

export interface LikeCommentProps {
    comment_id: number
}

export interface UnlikeCommentProps {
    comment_id: number
}

export interface HideMomentProps {
    moment_id: number
}

export interface UnhideMomentProps {
    moment_id: number
}

export interface DeleteMomentProps {
    moment_id: number
    user_id: number
}

export interface UndeleteMomentProps {
    moment_id: number
}
