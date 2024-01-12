import { UserProps } from "../../types";
const Block = require('../../../../models/user/block-model.js');
/**
 * Checks if the user is blocked by the specified candidate.
 * @param {number} user_id - ID of the user.
 * @param {UserProps} candidate - Candidate user.
 * @returns {Promise<boolean>} - A Promise that resolves to a boolean indicating if the user is blocked by the candidate.
 */
export async function setUserBlocked(user_id: number, candidate: UserProps): Promise<boolean | null> {
    const user_blocked = await Block.findOne({
        attributes: ['blocked_user_id', 'user_id'],
        where: { blocked_user_id: user_id, user_id: candidate.id }
    });

    if (user_blocked) return null; // If the user is blocked by the candidate, return null
    return Boolean(user_blocked);
}