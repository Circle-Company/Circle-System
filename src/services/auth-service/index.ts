import { find_username_already_in_use } from "./auth-find-service";
import { change_password, store_new_user } from "./store-actions-service";

export const AuthService = {
    Store: {
        NewUser: store_new_user,
        ChangePassword: change_password
    },
    Find: {
        UsernameAlreadyInUse: find_username_already_in_use
    }
}