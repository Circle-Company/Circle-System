import { search_mixer } from "./src/modules/search_mixer";

type SearchEngineProps = {
    search_term: string;
    user_id: number;
};

export async function SearchEngine({
    user_id, 
    search_term
}: SearchEngineProps): Promise<any> {

    console.time(`search-engine (term: ${search_term})`)
    const mixed_search = search_mixer({user_id, search_term })
    console.timeEnd(`search-engine (term: ${search_term})`)
    return mixed_search
}