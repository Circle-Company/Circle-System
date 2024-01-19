import { findUserFollow } from "../../functions/set_interactions/find_user_follow";

const User = require('../../../../models/user/user-model.js')
const ProfilePicture = require('../../../../models/user/profilepicture-model.js')
const Statistic = require('../../../../models/user/statistic-model.js')
interface UserObject {
    user: {
      username: string;
      user_id: number;
    };
    weight: number;
}
type CompleteCandidatesinformationsProps = {
    user_id: number
    filtered_candidates: UserObject[]
}

export async function complete_candidates_informations({
    user_id,
    filtered_candidates
}: CompleteCandidatesinformationsProps) {
    const users = await Promise.all(
        filtered_candidates.map(async(candidate) => {
            const user = await User.findOne({
                attributes: ['id', 'username', 'verifyed', 'muted', 'blocked', 'name'],
                where: {id: candidate.user.user_id},
                include: [
                    {
                        model: ProfilePicture,
                        as: 'profile_pictures',
                        attributes: ['tiny_resolution'],
                    },
                    {
                        model: Statistic,
                        as: 'statistics',
                        attributes: ['total_followers_num'],
                    }
                ],
            })

            return {
                id: user.id,
                username: user.username,
                verifyed: user.verifyed,
                name: user.name,
                muted: user.muted,
                blocked: user.blocked,
                you_follow: Boolean(await findUserFollow({user_id, followed_user_id: user.id})),
                profile_picture: {
                    tiny_resolution: user.profile_pictures.tiny_resolution
                },
                statistic: user.statistics,
                weight: candidate.weight
            }
        })
    )
    return users.filter((user) => user !== null)
}