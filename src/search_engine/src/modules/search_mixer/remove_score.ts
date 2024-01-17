interface User {
    id: number;
    username: string;
    name: string
    verifyed: boolean;
    you_follow: boolean;
    profile_picture: {
        tiny_resolution: string | null;
    };
    score: number;
}

export function remove_score(userList: User[]): Omit<User, 'score'>[] {
    // Mapeia a lista para remover o campo "score"
    const userListWithoutScore: Omit<User, 'score'>[] = userList.map(({ id, username,name, verifyed, you_follow, profile_picture }) => ({
        id,
        username,
        name,
        verifyed,
        you_follow,
        profile_picture,
    }));

    return userListWithoutScore;
}