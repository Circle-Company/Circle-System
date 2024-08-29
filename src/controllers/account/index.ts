import {
    edit_profile_picture,
    edit_user_description,
    edit_user_name,
    edit_user_username,
    updateUserCoordinates,
} from "./account-edit-controller"

import {
    delete_profile_picture,
    delete_user_description,
    delete_user_name,
} from "./account-delete-controller"

export const AccountController = {
    EdituserDescription: edit_user_description,
    EditProfilePicture: edit_profile_picture,
    EditUserName: edit_user_name,
    EditUserUsername: edit_user_username,
    EditCoordinates: updateUserCoordinates,
    DeleteUserDescription: delete_user_description,
    DeleteProfilePicture: delete_profile_picture,
    DeleteUserName: delete_user_name,
}
