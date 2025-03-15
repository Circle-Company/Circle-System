import interactionWeights from "../../../data/positive_action_weights.json"

type updateUserEmbeddingProps = {
    userEmbedding: number[]
    postVector: number[]
    interactionType: string
}

// Função para atualizar o embedding do usuário com base no vetor do post e no tipo de interação
export async function updateUserEmbedding({
    userEmbedding,
    postVector,
    interactionType,
}: updateUserEmbeddingProps) {
    const weight = interactionWeights[interactionType] // Obter o peso da interação
    for (let i = 0; i < userEmbedding.length; i++) {
        userEmbedding[i] = userEmbedding[i] * (1 - weight) + postVector[i] * weight
    }
    return userEmbedding
}

export async function getUserEmbedding(userId: number): Promise<number[]> {
    return []
}
