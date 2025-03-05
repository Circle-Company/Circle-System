interface Similarity {
    moment_id: number;
    similarity: number;
}

interface MomentSimilarity {
    moment_id: number;
    similarities: Similarity[];
}

export function mapSimilaritiesToMoments(similarityMatrix: number[][], momentIndices: Record<string, number>): MomentSimilarity[] {
    const momentSimilarities: MomentSimilarity[] = [];

    Object.entries(momentIndices).forEach(([momentIdString, rowIndex]) => {
        const momentId = parseInt(momentIdString);
        const similarities: Similarity[] = [];

        Object.entries(momentIndices).forEach(([otherMomentIdString, columnIndex]) => {
            const otherMomentId = parseInt(otherMomentIdString);
            const similarity = similarityMatrix[rowIndex][columnIndex];
            similarities.push({ moment_id: otherMomentId, similarity });
        });

        momentSimilarities.push({ moment_id: momentId, similarities });
    });

    return momentSimilarities;
}
