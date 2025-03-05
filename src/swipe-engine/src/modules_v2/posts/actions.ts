import {
    UpdatedStatistics,
    updateEngagementEmbedding,
} from "./embeddings/engagement";
import { updateTagsEmbedding } from "./embeddings/tags";

type UpdatedPostEmbeddingProps = {
    updatedStatistics?: UpdatedStatistics;
    updatedTags?: string[];
    currentEmbedding: number[];
    totalDuration: number; // miliseconds
};

export function updatePostEmbedding({
    updatedStatistics,
    updatedTags,
    currentEmbedding,
    totalDuration,
}: UpdatedPostEmbeddingProps) {
    const engagementSize = 10; // Tamanho da embedding de engajamento (baseado no exemplo anterior)
    const currentEngagementEmbedding = currentEmbedding.slice(
        0,
        engagementSize
    );
    const currentTagsEmbedding = currentEmbedding.slice(engagementSize);

    // Atualizar a embedding de engajamento, se necessário
    const newEngagementEmbedding = updatedStatistics
        ? updateEngagementEmbedding(
              currentEngagementEmbedding,
              updatedStatistics,
              totalDuration
          )
        : currentEngagementEmbedding;

    // Atualizar a embedding de tags, se necessário
    const newTagsEmbedding = updatedTags
        ? updateTagsEmbedding(currentTagsEmbedding, updatedTags)
        : currentTagsEmbedding;

    // Combinar as duas embeddings
    return [...newEngagementEmbedding, ...newTagsEmbedding];
}

export async function getPostEmbedding(postId: number): Promise<number[]> {
    return [];
}
