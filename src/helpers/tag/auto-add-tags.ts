import { create_moment_tag } from "./create-moment_tag"
import { create_tag } from "./create-tag"
import { find_tag_exists } from "./find-tag-exists"
import { find_tag_id } from "./find-tag-id";
import { AutoAddTagsProps, TagProps} from "./types"

export async function auto_add_tags({
    moment_id, tags
}: AutoAddTagsProps) {
    const createdTags = await Promise.all(tags.map(async (tag) => {
        const tag_exists = await find_tag_exists({ title: tag.title });
        if (tag_exists) {
            const existing_tag = await find_tag_id({title: tag.title})
            return await create_moment_tag({ moment_id, tag_id: existing_tag.id });
        } else {
            const new_tag = await create_tag({ title: tag.title });
            return await create_moment_tag({ moment_id, tag_id: new_tag.id });
        }
    }));

    return createdTags
}