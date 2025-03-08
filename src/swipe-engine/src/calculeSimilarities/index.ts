import moment_x_moment from "./moment_x_moment"
import user_x_user from "./user_x_user"

export default async function Swipe() {
    return {
        users_similarity: await user_x_user(),
        moments_similarity: await moment_x_moment(),
    }
}
