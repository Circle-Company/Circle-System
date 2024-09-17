export type StoreNewMemoryProps = {
    title: string
    user_id: number
}

export type EditMemoryTitleProps = {
    title: string
    user_id: number
    memory_id: number
}

export type StoreNewMemoryMomentProps = {
    memory_id: string
    moments_list: MomentsList[]
    user_id: number
}

export type DeleteMemoryProps = {
    memory_id: number
    user_id: number
}

export type DeleteMemoryMomentProps = {
    memory_id: number
    moment_id: number
    user_id: number
}

export type FindMemoryProps = {
    memory_id: number
}
export type FindMemoryMomentsProps = {
    user_id: number
    memory_id: number
    page: number
    pageSize: number
}

export type FindUserMemoriesProps = {
    user_id: number
    page: number
    pageSize: number
}

type MomentsList = {
    id: number
}
