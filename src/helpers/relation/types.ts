export type AutoAddRelationProps = {
    user_id: number,
    related_user_id: number,
    weight: number
}

export type CreateRelationProps = {
    user_id: number,
    related_user_id: number,
    weight: number
}

export type EditRelationProps = {
    user_id: number,
    related_user_id: number,
    increment_weight: number
}

export type FindRelationExistsProps = {
    user_id: number,
    related_user_id: number,
}