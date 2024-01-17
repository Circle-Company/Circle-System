type Item = any

export function mix_lists(list1: any, list2: any, mixingCoefficient: number) {
    const result = [];

    // Concatena as duas listas
    const combinedList: Item[] = [...list1, ...list2];

    // Ordena a lista combinada pelo campo "score"
    const sortedList: Item[] = combinedList.sort((a, b) => b.score - a.score);

    return sortedList;
}