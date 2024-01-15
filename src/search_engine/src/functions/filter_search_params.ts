import { FindSearchCandidatesProps } from "../types";
import { Op } from "sequelize";
/**
 * Applies a security layer to filter valid search parameters.
 * @param {FindSearchCandidatesProps} params - Parameters to be filtered.
 * @returns {Object} - Valid search parameters.
 */
export function filterSearchParams({
    user_id,
    username_to_search,
}: FindSearchCandidatesProps): Object {
    // Add any additional security checks for parameters if needed
    return {
        username: { [Op.like]: `${username_to_search.substring(0, 3)}%` },
        id: { [Op.not]: user_id },
        blocked: { [Op.not]: true },
        deleted: { [Op.not]: true },
    };
}