import {
    block_user,
    follow_user,
    report,
    unfollow_user,
    unlock_user,
} from "./user-actions-controller"
import {
    find_session_user_by_pk,
    find_session_user_statistics_by_pk,
    find_user_by_pk,
    find_user_by_username,
    find_user_data,
    find_user_followers,
    recommender_users,
    search_user,
} from "./user-find-controller"
import { store_user_metadata } from "./user-store-controller"

export const UserController = {
    SearchUser: search_user,
    FindUserByUsername: find_user_by_username,
    FindUserData: find_user_data,
    FindUserByPk: find_user_by_pk,
    FindSessionUserByPk: find_session_user_by_pk,
    FindSessionUserStatisticsByPk: find_session_user_statistics_by_pk,
    RecommenderUsers: recommender_users,
    FindUserFollowers: find_user_followers,
    BlockUser: block_user,
    UnlockUser: unlock_user,
    FollowUser: follow_user,
    UnfollowUser: unfollow_user,
    Report: report,
    StoreUserMetadata: store_user_metadata,
}
