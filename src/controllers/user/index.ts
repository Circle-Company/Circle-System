import {
    find_user_by_username,
    find_user_data,
    search_user,
    recommender_users,
    find_most_followed_users,
    find_user_by_pk,
    find_session_user_by_pk,
    find_session_user_statistics_by_pk
} from "./user-find-controller"
import {
    block_user,
    unlock_user,
    follow_user,
    unfollow_user,
    report
} from "./user-actions-controller"

export const UserController = {
    SearchUser: search_user,
    FindUserByUsername: find_user_by_username,
    FindUserData: find_user_data,
    FindUserByPk: find_user_by_pk,
    FindSessionUserByPk: find_session_user_by_pk,
    FindSessionUserStatisticsByPk: find_session_user_statistics_by_pk,
    RecommenderUsers: recommender_users,
    FindMostFollowedUsers: find_most_followed_users,
    BlockUser: block_user,
    UnlockUser: unlock_user,
    FollowUser: follow_user,
    UnfollowUser: unfollow_user,
    Report: report
}