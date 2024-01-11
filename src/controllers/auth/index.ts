import { authenticate_user, refresh_token} from "./authenticate-auth-controller";
import { store_new_user, verify_code, send_verification_code} from "./store-auth-controller";

export const AuthController = {
    StoreNewUser: store_new_user,
    AuthenticateUser: authenticate_user,
    SendVerificationCode: send_verification_code,
    VerifyCode: verify_code,
    RefreshToken: refresh_token
}