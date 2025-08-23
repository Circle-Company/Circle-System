import { auto_add_relation } from "./auto-add-relation";
import { create_relation } from "./create-relation";
import { edit_relation } from "./edit-relation";
import { find_relation_exists } from "./find-relation-exists";

export const Relation = {
    Create: create_relation,
    Edit: edit_relation,
    FindAlreadyExists: find_relation_exists,
    AutoAdd: auto_add_relation
}