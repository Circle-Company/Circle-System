import {
    block_user,
    follow_user,
    report,
    unfollow_user,
    unlock_user,
    updateUserCoordinates,
} from "./user-actions-controller"
import {
    find_most_followed_users,
    find_session_user_by_pk,
    find_session_user_statistics_by_pk,
    find_user_by_pk,
    find_user_by_username,
    find_user_data,
    recommender_users,
    search_user,
} from "./user-find-controller"

export const UserController = {
    SearchUser: search_user,
    FindUserByUsername: find_user_by_username,
    FindUserData: find_user_data,
    FindUserByPk: find_user_by_pk,
    FindSessionUserByPk: find_session_user_by_pk,
    FindSessionUserStatisticsByPk: find_session_user_statistics_by_pk,
    UpdateUserCoordinates: updateUserCoordinates,
    RecommenderUsers: recommender_users,
    FindMostFollowedUsers: find_most_followed_users,
    BlockUser: block_user,
    UnlockUser: unlock_user,
    FollowUser: follow_user,
    UnfollowUser: unfollow_user,
    Report: report,
}
