import { UserProps } from "../../types";
const Follow = require('../../../../models/user/follow-model.js');

/**
 * Checks if the user follows the specified candidate.
 * @param {number} user_id - ID of the user.
 * @param {UserProps} candidate - Candidate user.
 * @returns {Promise<boolean>} - A Promise that resolves to a boolean indicating if the user follows the candidate.
 */
export async function setUserFollowing(user_id: number, candidate: UserProps): Promise<boolean> {
    const user_followed = await Follow.findOne({
        attributes: ['followed_user_id', 'user_id'],
        where: { followed_user_id: candidate.id, user_id: user_id}
    });

    return Boolean(user_followed);
}