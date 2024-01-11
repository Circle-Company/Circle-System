import {
    find_user_by_username,
    find_user_data,
    search_user
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
    BlockUser: block_user,
    UnlockUser: unlock_user,
    FollowUser: follow_user,
    UnfollowUser: unfollow_user,
    Report: report
}