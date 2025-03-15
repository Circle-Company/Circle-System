type Item = { score: number }

export function mix_lists(list1: any, list2: any, mixingCoefficient: number) {
    const combinedList: Item[] = [...list1, ...list2]
    return combinedList.sort((a, b) => b.score - a.score)
}
