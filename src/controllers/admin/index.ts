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

export const AdminController = {
    BlockUser: block_user,
    UnlockUser: unlock_user,
    VerifyUser: verify_user,
    UnverifyUser: unverify_user,
    MuteUser: mute_user,
    UnmuteUser: unmute_user,
    DeleteUser: delete_user,
    UndeleteUser: undelete_user 
}