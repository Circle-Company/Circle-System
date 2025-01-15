import Relation from "../../models/user/relation-model"
import { FindRelationExistsProps } from "./types"

export async function find_relation_exists({
    user_id,
    related_user_id,
}: FindRelationExistsProps): Promise<boolean> {
    const finded = await Relation.findOne({
        where: { user_id, related_user_id },
    })
    return Boolean(finded)
}
