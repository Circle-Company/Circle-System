import { ValidationError } from "../../errors"
import { CreateTagProps } from "./types"
import Tag from '../../models/tags/tag-model.js'

export async function create_tag({ title }: CreateTagProps) {
    const tag = await Tag.create({ title })
    return tag
}