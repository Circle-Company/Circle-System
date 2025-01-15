import { InternalServerError } from "../../errors"
import Tag from "../../models/tags/tag-model"
import { FindTagExistsProps } from "./types"

export async function find_tag_id({ title }: FindTagExistsProps) {
    const tag = await Tag.findOne({ where: { title } })

    if (!tag) throw new InternalServerError({ message: "Error to find tag ID." })
    return tag
}
