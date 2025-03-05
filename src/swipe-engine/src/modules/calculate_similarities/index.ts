import user_x_user from "./user_x_user"
import moment_x_moment from "./moment_x_moment"

export default async function calculate_similarities() {
    return {
        users_similarity: await user_x_user(),
        moments_similarity: await moment_x_moment()
    }
}