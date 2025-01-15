import Tag from "../../models/tags/tag-model"
import { FindTagExistsProps } from "./types"

export async function find_tag_exists({ title }: FindTagExistsProps) {
    const tag = await Tag.findOne({ where: { title } })
    return Boolean(tag)
}
