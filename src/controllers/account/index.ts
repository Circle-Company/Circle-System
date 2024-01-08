import {
    edit_user_description,
    edit_profile_picture,
    edit_user_name,
    edit_user_username
} from "./account-edit-controller"

import {
    delete_profile_picture,
    delete_user_name,
    delete_user_description
} from "./account-delete-controller"

export const AccountController = {
    EdituserDescription: edit_user_description,
    EditProfilePicture: edit_profile_picture,
    EditUserName: edit_user_name,    
    EditUserUsername: edit_user_username,

    DeleteUserDescription: delete_user_description,
    DeleteProfilePicture: delete_profile_picture,
    DeleteUserName: delete_user_name
}