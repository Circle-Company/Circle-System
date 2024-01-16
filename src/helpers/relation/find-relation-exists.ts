import { FindRelationExistsProps } from "./types"
const Relation = require('../../models/user/relation-model.js')

export async function find_relation_exists({
    user_id, related_user_id
}: FindRelationExistsProps): Promise<boolean> {
    const finded = await Relation.findOne({
        where: { user_id, related_user_id }
    })
    if(finded) return true
    else return false
}