import { Op } from "sequelize";
import { IncrementUsersInformationsReturns, IncrementUsersInformationsProps } from "../types"
import User from '../../models/user/user-model.js';
import ProfilePicture from '../../models/user/profilepicture-model.js';
import Statistic from '../../models/user/statistic-model.js';

export async function IncrementUsersInformations({
    topUsers,
    totalPages,
    currentPage,
    pageSize,
}: IncrementUsersInformationsProps): Promise<IncrementUsersInformationsReturns>{
    const userPromises = topUsers.map(async (topUser) => {
        const user = await User.findOne({
            attributes: ['id', 'username', 'verifyed'],
            where: {
                id: topUser.user_id,
                muted: { [Op.not]: true },
                blocked: { [Op.not]: true },
                deleted: { [Op.not]: true },
            }
        })
        const statistic = await Statistic.findOne({
            attributes: ['total_followers_num'],
            where: {user_id: user.id}
        })
        const profile_picture = await ProfilePicture.findOne({
            attributes: ['tiny_resolution'],
            where: {user_id: user.id}
        })
        
        if (topUser.total_followers_num == 0) return null
        if(profile_picture.tiny_resolution == null) return null
        return {
                id: user.id,
                username: user.username,
                verifyed: user.verifyed,
                profile_picture,
                statistic
        }
    });

    const resolvedUsers = await Promise.all(userPromises)

    const cleanedUsers = resolvedUsers.filter((item) => item !== null);
    return {
        topUsers: cleanedUsers,
        totalPages,
        currentPage,
        pageSize,
    }
}