import { ValidationError } from "../errors"
import { search_mixer } from "./src/modules/search_mixer"

type SearchEngineProps = {
    search_term: string
    user_id: number
}

export async function SearchEngine({ user_id, search_term }: SearchEngineProps): Promise<any> {
    const { isValid, message } = isValidSearch(search_term)
    if (isValid) return search_mixer({ user_id, search_term })
    else throw new ValidationError({ message })
}
