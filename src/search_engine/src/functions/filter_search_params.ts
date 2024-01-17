import sequelize from "sequelize";
import { FindSearchCandidatesProps } from "../types";
import { Op } from "sequelize";

export function filterSearchParams({
    user_id,
    search_term,
}: FindSearchCandidatesProps): Object {
    return {
        [Op.and]: [
             sequelize.literal(`MATCH (username) AGAINST ('${search_term}*' IN BOOLEAN MODE)`),
            { id: { [Op.not]: user_id } },
            { blocked: { [Op.not]: true } },
            { deleted: { [Op.not]: true } },
        ],
    };
}