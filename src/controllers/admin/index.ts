import {
    block_user,
    unlock_user,
    verify_user,
    unverify_user,
    mute_user,
    unmute_user,
    delete_user,
    undelete_user
} from "./admin-user-controller"

import {
    list_blocked_users,
    list_deleted_users,
    list_verifyed_users,
    list_muted_users,
    list_admin_users,
    list_moderator_users
} from "./admin-lists-controller"

export const AdminController = {
    BlockUser: block_user,
    UnlockUser: unlock_user,
    VerifyUser: verify_user,
    UnverifyUser: unverify_user,
    MuteUser: mute_user,
    UnmuteUser: unmute_user,
    DeleteUser: delete_user,
    UndeleteUser: undelete_user,
    ListBlockedUsers: list_blocked_users,
    ListDeletedUsers: list_deleted_users,
    ListVerifyedUsers: list_verifyed_users,
    ListMutedUsers: list_muted_users,
    ListAdminUsers: list_admin_users,
    ListModeratorUsers: list_moderator_users

}