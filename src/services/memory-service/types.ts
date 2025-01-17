export type StoreNewMemoryProps = {
    title: string
    user_id: bigint
}

export type EditMemoryTitleProps = {
    title: string
    user_id: bigint
    memory_id: bigint
}

export type StoreNewMemoryMomentProps = {
    memory_id: bigint
    moments_list: MomentsList[]
    user_id: bigint
}

export type DeleteMemoryProps = {
    memory_id: bigint
    user_id: bigint
}

export type DeleteMemoryMomentProps = {
    memory_id: bigint
    moment_id: bigint
    user_id: bigint
}

export type FindMemoryProps = {
    memory_id: bigint
}
export type FindMemoryMomentsProps = {
    user_id: bigint
    memory_id: bigint
    page: number
    pageSize: number
}

export type FindUserMemoriesProps = {
    user_id: bigint
    page: number
    pageSize: number
}

type MomentsList = {
    id: bigint
}
