export type FindUserByUsernameProps = {
    user_id: number
    username: string
}
export type FindUserDataProps = {
    user_id: number
    username: string
}

export type UserSearchProps = {
    username_to_search: string,
    user_id: number
}

export type RecommenderUsersProps = {
    user_id: number
}

export type FollowUserProps = {
    user_id: number,
    followed_user_id: number
}   
export type BlockUserProps = {
    user_id: number,
    blocked_user_id: number
}
export type ReportUserProps = {
    user_id: number,
    reported_content_id: number,
    reported_content_type: ReportContentType,
    report_type: ReportTypes
} 

type ReportContentType =
"USER"
| "MOMENT"
| "MEMORY"
| "COMMENT"

type ReportTypes = 
"FAKE-NEWS"
| "SPAM"
| "BULLYING-OR-HARASSMENT"
| "NUDITY-OR-SEXUAL-ACTIVITY"
| "HATE-SPEACH-OR-SYMBOILS"
| "SCAM-OR-FRAUD"
| "SALE-REGULATED-OR-ILLICIT-PRODUCTS"
| "SUICIDE-OR-SELF-MUTILATION"
| "EATING-DISORDERS"