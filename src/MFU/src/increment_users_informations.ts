import { Op } from "sequelize"
import { InternalServerError } from "../../errors"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model"
import User from "../../models/user/user-model"
import { IncrementUsersInformationsProps, IncrementUsersInformationsReturns } from "../types"

export async function IncrementUsersInformations({
    topUsers,
    totalPages,
    currentPage,
    pageSize,
}: IncrementUsersInformationsProps): Promise<IncrementUsersInformationsReturns> {
    const userPromises = topUsers.map(async (topUser) => {
        const user = await User.findOne({
            attributes: ["id", "username", "verifyed"],
            where: {
                id: topUser.user_id,
                muted: { [Op.not]: true },
                blocked: { [Op.not]: true },
                deleted: { [Op.not]: true },
            },
        })

        if (!user) throw new InternalServerError({ message: "Error to find user." })
        const statistic = await Statistic.findOne({
            attributes: ["total_followers_num"],
            where: { user_id: user.id },
        })
        const profile_picture = await ProfilePicture.findOne({
            attributes: ["tiny_resolution"],
            where: { user_id: user.id },
        })

        if (!profile_picture)
            throw new InternalServerError({ message: "Error to find user profile picture." })
        if (topUser.total_followers_num == 0) return null
        if (profile_picture.tiny_resolution == null) return null
        return {
            id: BigInt(user.id),
            username: user.username,
            verifyed: user.verifyed,
            profile_picture,
            statistic,
        }
    })

    const resolvedUsers = await Promise.all(userPromises)

    const cleanedUsers: any = resolvedUsers.filter((item) => item !== null)
    return {
        topUsers: cleanedUsers,
        totalPages,
        currentPage,
        pageSize,
    }
}
