import Tag from "../../models/tags/tag-model"
import { CreateTagProps } from "./types"

export async function create_tag({ title }: CreateTagProps) {
    const tag = await Tag.create({ title })
    return tag
}
