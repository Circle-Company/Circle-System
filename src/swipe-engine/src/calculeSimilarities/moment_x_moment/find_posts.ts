import Moment from '../../../models/moments/moment-model.js'
import MomentTags from '../../../models/moments/moment_tag-model.js'
import { cosineSimilarity } from '../../../math/cossineSimilarity'

export default async function findPosts() {
    // Encontrar todos os momentos e suas tags
    const posts = await Moment.findAll({ attributes: ['id'] })
    const postTags = await Promise.all(posts.map(async (post) => {
        const tags = await MomentTags.findAll({
            attributes: ['tag_id'],
            where: { moment_id: post.id }
        })
        const tagIds = tags.map((tag) => tag.tag_id)
        return { moment_id: post.id, tags_ids: tagIds }
    }))

    // Identificar todas as tags únicas
    const uniqueTags = Array.from(new Set(postTags.flatMap(postTag => postTag.tags_ids)))

    // Criar a matriz de ocorrências
    const occurrenceMatrix = postTags.map(postTag => {
        const vector = uniqueTags.map(tagId => (postTag.tags_ids.includes(tagId) ? 1 : 0))
        return { moment_id: postTag.moment_id, vector }
    })

    // Calcular a similaridade de cosseno
    const similarityMatrix: any = [];   
    const momentIds = occurrenceMatrix.map(post => post.moment_id)
    for (let i = 0; i < occurrenceMatrix.length; i++) {
        const row: any = []
        for (let j = 0; j < occurrenceMatrix.length; j++) {
            const similarity = cosineSimilarity(occurrenceMatrix[i].vector, occurrenceMatrix[j].vector)
            row.push(Number(similarity.toFixed(4)))
        }
        similarityMatrix.push(row)
    }

    // Mapear os IDs dos momentos para os índices da matriz
    let momentIndices = {}
    momentIds.forEach((momentId, index) => { momentIndices[momentId] = index })
    return similarityMatrix
}
