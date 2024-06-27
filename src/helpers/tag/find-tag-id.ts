import { ValidationError } from "../../errors"
import { FindTagExistsProps } from "./types"
import Tag from '../../models/tags/tag-model.js'

export async function find_tag_id({ title }: FindTagExistsProps) {
    const tag = await Tag.findOne({ where: {title} })
    return tag
}