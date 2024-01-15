import { Op } from "sequelize";
import { IncrementUsersInformationsReturns, IncrementUsersInformationsProps } from "../types"
const User = require('../../models/user/user-model.js')
const ProfilePicture = require('../../models/user/profilepicture-model.js')
const Statistic = require('../../models/user/statistic-model.js')

export async function IncrementUsersInformations({
    topUsers,
    totalPages,
    currentPage,
    pageSize,
    totalUsers
}: IncrementUsersInformationsProps): Promise<Array<IncrementUsersInformationsReturns>>{
    const userPromises = topUsers.map(async (topUser) => {
        const user = await User.findOne({
            attributes: ['id', 'username', 'verifyed'],
            where: {
                id: topUser.user_id,
                muted: { [Op.not]: true },
                blocked: { [Op.not]: true },
                deleted: { [Op.not]: true },
                '$statistics.total_followers_num$': { [Op.gt]: 0 },
            },
            include: [
                {
                  model: ProfilePicture,
                  as: 'profile_pictures', // Nome da associação no modelo User
                  attributes: ['tiny_resolution'], // Atributos que você deseja incluir
                },
                {
                    model: Statistic,
                    as: 'statistics',
                    attributes: ['total_followers_num'],
                },
            ],
        });

        if(user.profile_pictures.tiny_resolution == null) return null
        return {
            
                id: user.id,
                username: user.username,
                verifyed: user.verifyed,
                profile_picture: {
                    tiny_resolution: user.profile_pictures.tiny_resolution
                },
                statistic: {
                    total_followers_num: user.statistics.total_followers_num
                }
        }
    });

    const resolvedUsers = await Promise.all(userPromises)

    const cleanedUsers = resolvedUsers.filter((item) => item !== null);
    return {
        topUsers: cleanedUsers,
        totalPages,
        currentPage,
        pageSize,
        totalUsers
    }
}