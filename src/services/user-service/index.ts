import {
    block_user,
    follow_user,
    report_user,
    unfollow_user,
    unlock_user
} from "./user-actions-service"
import { find_user_by_username, find_user_data, recommender_users, search_user } from "./user-find-service"

export const UserService = {
    UserActions: {
        FollowUser: follow_user,
        UnfollowUser: unfollow_user,
        BlockUser: block_user,
        UnlockUser: unlock_user,
        ReportUser: report_user
    },
    UserFind: {
        FindByUsername: find_user_by_username,
        FindAllData: find_user_data,
        SearchUser: search_user,
        RecommenderUsers: recommender_users
    }
}