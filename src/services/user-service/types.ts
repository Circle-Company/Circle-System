export type FindUserByUsernameProps = {
    user_id: bigint
    username: string
}
export type FindUserDataProps = {
    user_id: bigint
    username: string
}

export type UserSearchProps = {
    username_to_search: string
    user_id: bigint
}

export type RecommenderUsersProps = {
    user_id: bigint
}

export type FollowUserProps = {
    user_id: bigint
    followed_user_id: bigint
}
export type BlockUserProps = {
    user_id: bigint
    blocked_user_id: bigint
}
export type ReportUserProps = {
    user_id: bigint
    reported_content_id: bigint
    reported_content_type: ReportContentType
    report_type: ReportTypes
}

type ReportContentType = "USER" | "MOMENT" | "MEMORY" | "COMMENT"

type ReportTypes =
    | "FAKE-NEWS"
    | "SPAM"
    | "BULLYING-OR-HARASSMENT"
    | "NUDITY-OR-SEXUAL-ACTIVITY"
    | "HATE-SPEACH-OR-SYMBOILS"
    | "SCAM-OR-FRAUD"
    | "SALE-REGULATED-OR-ILLICIT-PRODUCTS"
    | "SUICIDE-OR-SELF-MUTILATION"
    | "EATING-DISORDERS"
