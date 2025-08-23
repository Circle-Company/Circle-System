import { auto_add_tags } from "./auto-add-tags";
import { create_moment_tag } from "./create-moment_tag";
import { create_tag } from "./create-tag";
import { find_tag_exists } from "./find-tag-exists";

export const Tag = {
    Create: create_tag,
    CreateMoment: create_moment_tag, 
    FindAlreadyExists: find_tag_exists,
    AutoAdd: auto_add_tags
}