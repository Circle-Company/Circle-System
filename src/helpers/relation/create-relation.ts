import { find_relation_exists } from "./find-relation-exists"
import { ValidationError } from "../../errors"
import { CreateRelationProps } from "./types"
const Relation = require('../../models/user/relation-model.js')

export async function create_relation({
    user_id, related_user_id, weight
}: CreateRelationProps) {
    const relation_exists = await find_relation_exists({user_id, related_user_id})
    if(relation_exists){
        return new ValidationError({
            message: 'this user relation already exists',
        })
    }if(user_id == related_user_id) {
        return new ValidationError({
            message: 'a user cannot relate to themselves',
        })
    } else {
        await Relation.create({ user_id, related_user_id, weight })        
    }
}