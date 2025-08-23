import Relation from "../../models/user/relation-model"
import { edit_relation } from "./edit-relation"
import { find_relation_exists } from "./find-relation-exists"
import { AutoAddRelationProps } from "./types"

export async function auto_add_relation({
    user_id,
    related_user_id,
    weight,
}: AutoAddRelationProps) {
    const relation_exists = await find_relation_exists({ user_id, related_user_id })
    if (relation_exists) {
        await edit_relation({ user_id, related_user_id, increment_weight: weight })
    } else {
        await Relation.create({ user_id, related_user_id, weight })
    }
}
