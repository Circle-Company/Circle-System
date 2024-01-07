import {
    find_user_by_username,
    find_user_data
} from "./user-find-controller"

import {
    edit_user_description,
    delete_user_description
} from "./user-edit-controller"

export const UserController = {
    FindUserByUsername: find_user_by_username,
    FindUserData: find_user_data,
    EdituserDescription: edit_user_description,
    DeleteUserDescription: delete_user_description
}