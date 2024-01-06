import { authenticate_user } from "./authenticate-auth-controller";
import { store_new_user } from "./store-auth-controller";

export const AuthController = {
    StoreNewUser: store_new_user,
    AuthenticateUser: authenticate_user
}