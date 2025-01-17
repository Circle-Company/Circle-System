import User from "../../models/user/user-model"

export interface MomentProps {
    id: bigint
    description: string
    midia: MidiaProps
    metadata: MetadataProps
    tags: TagProps[]
    statistic: StatisticProps
    visible?: boolean
    blocked?: boolean
    deleted?: boolean
}

export interface UserType extends User {
    profile_pictures: any
}

export interface NewMomentProps {
    id: bigint
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
    user_id: bigint
    content: string
}

export interface InteractionQueueProps {
    length: number
    period: number
    data: MomentInteractionProps[]
}

export interface MomentInteractionProps {
    id: number
    user_id: bigint
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
    id: bigint
    name: string
}

export interface FindUserFeedMomentsProps {
    interaction_queue: InteractionQueueProps
    user_id: bigint
}

export interface FindUserMomentsProps {
    page: number
    pageSize: number
    user_id: bigint
    finded_user_pk: bigint
}

export interface FindUserMomentsTinyExcludeMemoryProps {
    memory_id: bigint
    user_id: bigint
}

export interface FindMomentTagsProps {
    moment_id: bigint
}

export interface FindMomentStatisticsViewProps {
    moment_id: bigint
    user_id: bigint
}

export interface StoreNewMomentsProps {
    user_id: bigint
    moment: NewMomentProps
}

export interface CommentOnMomentProps {
    moment_id: bigint
    user_id: bigint
    content: string
}

export interface ReplyCommentOnMomentProps {
    moment_id: bigint
    user_id: bigint
    parent_comment_id: number
    content: string
    page: number
    pageSize: number
}

export interface LikeCommentProps {
    comment_id: bigint
    user_id: bigint
}

export interface UnlikeCommentProps {
    comment_id: bigint
    user_id: bigint
}

export interface HideMomentProps {
    moment_id: bigint
    user_id: bigint
}

export interface UnhideMomentProps {
    moment_id: bigint
    user_id: bigint
}

export interface DeleteMomentProps {
    moment_id: bigint
    user_id: bigint
}

export interface UndeleteMomentProps {
    moment_id: bigint
    user_id: bigint
}
