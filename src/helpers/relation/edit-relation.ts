import { find_relation_exists } from "./find-relation-exists"
import { ValidationError } from "../../errors"
import { EditRelationProps } from "./types"
const Relation = require('../../models/user/relation-model.js')

export async function edit_relation({
    user_id, related_user_id, increment_weight
}: EditRelationProps) {
    const relation_exists = await find_relation_exists({user_id, related_user_id})
    if(relation_exists === true){
        await Relation.increment('weight',{
            by: increment_weight,
            where: { user_id, related_user_id }
        })
    } else {
        return new ValidationError({
            message: 'this user relation does not exist',
        }) 
    }

}