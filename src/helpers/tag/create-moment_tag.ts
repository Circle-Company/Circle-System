import { CreateMomentTagProps } from "./types"
import MomentTag from "../../models/moments/moment_tag-model.js"

export async function create_moment_tag({ tag_id, moment_id }: CreateMomentTagProps) {
    const moment_tag = await MomentTag.create({ tag_id, moment_id })
    return moment_tag
}
