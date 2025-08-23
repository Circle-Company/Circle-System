export type CreateTagProps = {
    title: string
}

export type CreateMomentTagProps = {
    tag_id: bigint
    moment_id: bigint
}

export type FindTagExistsProps = {
    title: string
}

export type AutoAddTagsProps = {
    moment_id: bigint
    tags: TagProps[]
}

export type TagProps = {
    title: string
}
