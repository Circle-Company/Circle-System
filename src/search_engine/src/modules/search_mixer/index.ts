import { search_engine_config } from "../../../config"
import { related_candidates } from "../related_candidates"
import { unknown_candidates } from "../unknown_candidates"
import { mix_lists } from "./mix_lists"
import { security_filter } from "./security_filter"

interface UserObject {
    id: bigint
    username: string
    verifyed: false
    you_follow: boolean
    profile_picture: {
        tiny_resolution: null | string
    }
    score: number
}

type SearchMixerProps = {
    user_id: bigint
    search_term: string
}
export async function search_mixer({
    user_id,
    search_term,
}: SearchMixerProps): Promise<UserObject[]> {
    const related_candidates_list = await related_candidates({ user_id, search_term })
    const unknown_candidates_list = await unknown_candidates({
        user_id,
        search_term,
        related_candidates_list,
    })
    const mixed_list = mix_lists(
        related_candidates_list,
        unknown_candidates_list,
        search_engine_config.MIX_COEFFICIENT
    )
    const candidates_with_security = security_filter({ candidates: mixed_list })
    return candidates_with_security
}
