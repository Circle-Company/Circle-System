import { find_relation_exists } from "./find-relation-exists"
import { edit_relation } from "./edit-relation"
import { create_relation } from "./create-relation"
import { AutoAddRelationProps } from "./types"
import Relation from '../../models/user/relation-model.js'

export async function auto_add_relation({
    user_id, related_user_id, weight
}: AutoAddRelationProps) {
    const relation_exists = await find_relation_exists({user_id, related_user_id})
    if(relation_exists){
        await edit_relation({user_id, related_user_id, increment_weight: weight})
    } else {
        await Relation.create({ user_id, related_user_id, weight })
    }
}