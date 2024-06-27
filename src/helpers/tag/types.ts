export type CreateTagProps = {
    title: string
}

export type CreateMomentTagProps = {
    tag_id: number,
    moment_id: number
}

export type FindTagExistsProps = {
    title: string
}

export type AutoAddTagsProps = {
    moment_id: number,
    tags: TagProps[]
}

export type TagProps = {
    title: string
}