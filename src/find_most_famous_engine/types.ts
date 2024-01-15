export type TopUsersProps = Array<TopUserObjectProps>

export type TopUserObjectProps = {

    total_followers_num: number,
    user_id: number
}
export type FindTopFollowedsProps = {
    page: number,
    pageSize: number
}

export type FindMostFamousEngineProps = {
    page: number,
    pageSize: number
}

export type IncrementUsersInformationsProps = {
    topUsers: TopUsersProps,
    totalPages: number,
    currentPage: number,
    pageSize: number,
    totalUsers: number,
}

export type IncrementUsersInformationsReturns = {
    topUsers: TopUsersIncrementedProps,
    totalPages: number,
    currentPage: number,
    pageSize: number,
    totalUsers: number,
}

export type TopUsersIncrementedProps = Array<TopUserIncrementedObjectProps>

export type TopUserIncrementedObjectProps = {
    id: number,
    username: string,
    name: null | string,
    verifyed: boolean,
    profile_pictures: {
        tiny_resolution: null | string
    },
    statistics: {
        total_followers_num: number
    }
}