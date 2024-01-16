import { FindTopFolloweds } from "./src/find_top_followeds";
import { IncrementUsersInformations } from "./src/increment_users_informations"; 
import { FindMostFamousEngineProps } from "./types";

export async function FindMostFamousEngine({
    page, pageSize
}: FindMostFamousEngineProps) {

    const finded_top_followeds = await FindTopFolloweds({page, pageSize})
    const top_followeds_with_users = await IncrementUsersInformations(finded_top_followeds)

    console.log(top_followeds_with_users)
    return top_followeds_with_users

}