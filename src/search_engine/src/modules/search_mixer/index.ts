import { ReturnUserProps, SearchMixerProps } from "search_engine/src/types"
import { search_engine_config } from "../../../config"
import { related_candidates } from "../related_candidates"
import { unknown_candidates } from "../unknown_candidates"
import { mix_lists } from "./mix_lists"
import { security_filter } from "./security_filter"

export async function search_mixer({
    user_id,
    search_term,
}: SearchMixerProps): Promise<ReturnUserProps[]> {
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
    return security_filter({ candidates: mixed_list })
}
