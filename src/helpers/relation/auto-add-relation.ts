import { find_relation_exists } from "./find-relation-exists"
import { edit_relation } from "./edit-relation"
import { create_relation } from "./create-relation"
import { AutoAddRelationProps } from "./types"
const Relation = require('../../models/user/relation-model.js')

export async function auto_add_relation({
    user_id, related_user_id, weight
}: AutoAddRelationProps) {
    const relation_exists = await find_relation_exists({
        user_id, related_user_id 
    })
    console.log(relation_exists)
    if(relation_exists){

    } else {
        await Relation.create({ user_id, related_user_id, weight })
    }
}