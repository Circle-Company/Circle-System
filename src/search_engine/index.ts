import { ValidationError } from "../errors"
import { isValidSearch } from "./src/modules/is_valid_search"
import { search_mixer } from "./src/modules/search_mixer"

type SearchEngineProps = {
    search_term: string
    user_id: bigint
}

export async function SearchEngine({ user_id, search_term }: SearchEngineProps): Promise<any> {
    const { isValid, message } = isValidSearch(search_term)
    if (isValid) return await search_mixer({ user_id, search_term })
    else throw new ValidationError({ message })
}
