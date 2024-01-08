import {
    find_user_by_username,
    find_user_data
} from "./user-find-controller"
import {
    block_user,
    unlock_user
} from "./user-actions-controller"

export const UserController = {
    FindUserByUsername: find_user_by_username,
    FindUserData: find_user_data,
    BlockUser: block_user,
    UnlockUser: unlock_user
}