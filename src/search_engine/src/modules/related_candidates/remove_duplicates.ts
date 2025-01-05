interface User {
    user: {
        username: string
        user_id: bigint
    }
    weight: number
}

type RemoveDuplicatesProps = {
    finded_candidates: User[]
}

export function remove_duplicates({ finded_candidates }: RemoveDuplicatesProps): User[] {
    const idsSet = new Set<bigint>()
    const uniqueUsers: User[] = []

    for (const user of finded_candidates) {
        if (!idsSet.has(user.user.user_id)) {
            // Adiciona o ID ao conjunto para rastrear duplicatas
            idsSet.add(user.user.user_id)

            // Adiciona o usuário único à nova lista
            uniqueUsers.push(user)
        }
    }

    return uniqueUsers
}
