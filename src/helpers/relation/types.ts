export type AutoAddRelationProps = {
    user_id: bigint
    related_user_id: bigint
    weight: number
}

export type CreateRelationProps = {
    user_id: bigint
    related_user_id: bigint
    weight: number
}

export type EditRelationProps = {
    user_id: bigint
    related_user_id: bigint
    increment_weight: number
}

export type FindRelationExistsProps = {
    user_id: bigint
    related_user_id: bigint
}
