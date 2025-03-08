function groupScoresById(tagsScores) {
    const groupedScores = {};
    
    tagsScores.forEach(tagScore => {
        const id = tagScore.id;
        const score = tagScore.score;
        
        if (!groupedScores[id]) {
            groupedScores[id] = [];
        }
        
        groupedScores[id].push({ id, score });
    });
    
    return groupedScores;
}

function calculateAverageScores(groupedScores) {
    const averagedScores: {tag_id: number, weight: number}[] = [];
    
    Object.keys(groupedScores).forEach(id => {
        const scores = groupedScores[id];
        const sum = scores.reduce((acc, curr) => acc + curr.score, 0);
        const average = sum / scores.length;
        averagedScores.push({ tag_id: Number(id), weight: average });
    });
    
    return averagedScores;
}

export async function calculeTagsWeight(processed_interactions, aditional_features) {

    const tags_vector = aditional_features.tags_vector
    const moment_tags_ids_vector = processed_interactions.moment_tags_ids_vector
    const interactions_vector = aditional_features.interations_vector

    // Inicializa um array para armazenar os resultados
    const tagsScores: any = [];

    // Itera sobre cada momento
    moment_tags_ids_vector.forEach(moment => {
        const momentId: any = moment.id;
        const momentTags: any = moment.tags;

        // Inicializa um objeto para armazenar as pontuações das tags para este momento
        const momentTagScores: any = [];

        // Itera sobre cada tag do momento
        momentTags.forEach(momentTag => {
            const tagId = momentTag.id;

            // Encontra o TF-IDF correspondente para esta tag
            const tfidf: any = tags_vector.find(tag => tag.id === tagId)?.tfidf || 0;

            // Encontra o vetor de interações correspondente para este momento
            const momentInteraction: any = interactions_vector.find(interaction => interaction.moment_id === momentId);
            
            // Calcula a pontuação da tag para este momento multiplicando o TF-IDF pelo vetor de interações e calculando a média
            const tagScore: any = tfidf * momentInteraction.interaction_rate == 0? 0 : momentInteraction.interaction_rate;

            // Adiciona a pontuação da tag ao array de pontuações das tags para este momento
            momentTagScores.push({ id: tagId, score: tagScore });
        });

        // Adiciona as pontuações das tags para este momento ao array de resultados
        tagsScores.push({ moment_id: momentId, tags_scores: momentTagScores });
    });

    const flattenedTagsScores: {id: number, score: number}[] = []
    tagsScores.forEach(moment => {
        moment.tags_scores.forEach(tagScore => {
            flattenedTagsScores.push(tagScore)
        });
    });

    const tagsScoreGrouped = groupScoresById(flattenedTagsScores)

    const averagedScoresVector = calculateAverageScores(tagsScoreGrouped)
    return averagedScoresVector;
}