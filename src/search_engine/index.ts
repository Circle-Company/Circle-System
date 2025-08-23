import { ValidationError } from "../errors"
import { isValidSearch } from "./src/modules/is_valid_search"
import { search_mixer } from "./src/modules/search_mixer"
import { ReturnUserProps, SearchEngineProps } from "./src/types"

type SearchEngineResponseProps = Array<ReturnUserProps>

export async function SearchEngine({
    userId,
    searchTerm,
}: SearchEngineProps): Promise<SearchEngineResponseProps> {
    const { isValid, message } = isValidSearch(searchTerm)
    if (isValid) return await search_mixer({ user_id: userId, search_term: searchTerm })
    else throw new ValidationError({ message })
}
