import { getEngagementEmbedding } from "./engagement";
import { getTagsEmbedding } from "./tags";

export type InteractionProps =
    | "like"
    | "share"
    | "clickIntoMoment"
    | "watchTime"
    | "clickProfile"
    | "comment"
    | "showLessOften"
    | "report";

type PostEmbeddingProps = {
    statistics: {
        likes: number;
        shares: number;
        clicksIntoMoment: number;
        watchTime: number; // miliseconds
        clicksProfile: number;
        comments: number;
        views: number;
        skips: number;
        showLessOften: number;
        report: number;
    };
    metadata: {
        totalDuration: number; // miliseconds
        createdAt: string;
    };
    tags: string[];
};

export function createPostEmbedding({
    statistics,
    metadata,
    tags,
}: PostEmbeddingProps) {
    const engagementEmbedding = getEngagementEmbedding({
        statistics,
        metadata,
    });

    const tagsEmbedding = getTagsEmbedding(tags);

    const postEmbedding = [...engagementEmbedding, ...tagsEmbedding];

    return postEmbedding;
}
