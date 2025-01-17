import { authenticate_user, refresh_token } from "./auth-authenticate-controller"
import { find_username_already_in_use } from "./auth-find-controller"
import {
    change_password,
    send_verification_code,
    store_new_user,
    verify_code,
} from "./auth-store-controller"

export const AuthController = {
    StoreNewUser: store_new_user,
    AuthenticateUser: authenticate_user,
    SendVerificationCode: send_verification_code,
    VerifyCode: verify_code,
    RefreshToken: refresh_token,
    SendSocket: send_socket,
    UsernameAlreadyInUse: find_username_already_in_use,
    ChangePassword: change_password
}