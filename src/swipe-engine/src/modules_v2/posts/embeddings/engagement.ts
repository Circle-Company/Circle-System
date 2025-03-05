type EngagementEmbeddingProps = {
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
};

// Função para calcular o embedding de engajamento com normalização por log e watch time baseado na duração total do post
export function getEngagementEmbedding({
    statistics,
    metadata,
}: EngagementEmbeddingProps) {
    const {
        likes,
        shares,
        clicksIntoMoment,
        watchTime,
        clicksProfile,
        comments,
        views,
        skips,
        showLessOften,
        report,
    } = statistics;

    const { totalDuration } = metadata;

    // Normalizando com logaritmo natural (log base e)
    const normalizedLikes = Math.log1p(likes); // log(likes + 1)
    const normalizedShares = Math.log1p(shares); // log(shares + 1)
    const normalizedClicksIntoMoment = Math.log1p(clicksIntoMoment); // log(clicksIntoMoment + 1)
    const normalizedClicksProfile = Math.log1p(clicksProfile); // log(clicksProfile + 1)
    const normalizedComments = Math.log1p(comments); // log(comments + 1)
    const normalizedViews = Math.log1p(views); // log(views + 1)
    const normalizedSkips = Math.log1p(skips); // log(skips + 1)
    const normalizedShowLessOften = Math.log1p(showLessOften); // log(showLessOften + 1)
    const normalizedReports = Math.log1p(report); // log(reports + 1)

    // Normalizar o watchTime com base na duração total do post
    const normalizedWatchTime =
        totalDuration > 0 ? watchTime / totalDuration : 0;

    // Combina todos os valores normalizados em um vetor de embedding
    return [
        normalizedLikes,
        normalizedShares,
        normalizedClicksIntoMoment,
        normalizedWatchTime,
        normalizedClicksProfile,
        normalizedComments,
        normalizedViews,
        normalizedSkips,
        normalizedShowLessOften,
        normalizedReports,
    ];
}

export type UpdatedStatistics = {
    likes?: number;
    shares?: number;
    clicksIntoMoment?: number;
    watchTime?: number; // miliseconds
    clicksProfile?: number;
    comments?: number;
    views?: number;
    skips?: number;
    showLessOften?: number;
    report?: number;
};

export function updateEngagementEmbedding(
    currentEmbedding: number[],
    statistics: UpdatedStatistics,
    totalDuration: number
): number[] {
    const [
        currentLikes,
        currentShares,
        currentClicksIntoMoment,
        currentWatchTime,
        currentClicksProfile,
        currentComments,
        currentViews,
        currentSkips,
        currentShowLessOften,
        currentReports,
    ] = currentEmbedding;

    // Atualizar os valores normalizados usando log1p
    const normalizedLikes =
        statistics.likes !== undefined
            ? Math.log1p(statistics.likes)
            : currentLikes;
    const normalizedShares =
        statistics.shares !== undefined
            ? Math.log1p(statistics.shares)
            : currentShares;
    const normalizedClicksIntoMoment =
        statistics.clicksIntoMoment !== undefined
            ? Math.log1p(statistics.clicksIntoMoment)
            : currentClicksIntoMoment;
    const normalizedClicksProfile =
        statistics.clicksProfile !== undefined
            ? Math.log1p(statistics.clicksProfile)
            : currentClicksProfile;
    const normalizedComments =
        statistics.comments !== undefined
            ? Math.log1p(statistics.comments)
            : currentComments;
    const normalizedViews =
        statistics.views !== undefined
            ? Math.log1p(statistics.views)
            : currentViews;
    const normalizedSkips =
        statistics.skips !== undefined
            ? Math.log1p(statistics.skips)
            : currentSkips;
    const normalizedShowLessOften =
        statistics.showLessOften !== undefined
            ? Math.log1p(statistics.showLessOften)
            : currentShowLessOften;
    const normalizedReports =
        statistics.report !== undefined
            ? Math.log1p(statistics.report)
            : currentReports;

    // Atualizar o watchTime baseado na duração total do post
    const normalizedWatchTime =
        statistics.watchTime !== undefined
            ? totalDuration > 0
                ? statistics.watchTime / totalDuration
                : 0
            : currentWatchTime;

    // Retornar a nova embedding de engajamento
    return [
        normalizedLikes,
        normalizedShares,
        normalizedClicksIntoMoment,
        normalizedWatchTime,
        normalizedClicksProfile,
        normalizedComments,
        normalizedViews,
        normalizedSkips,
        normalizedShowLessOften,
        normalizedReports,
    ];
}
