import { InteractionQueueProps } from "./types";

interface Tag { id: number, name: string }

const MAX_DURATION = 60 * 1000 // 60 seconds

export function encodeContentType(type: string): number[]{
    const types = ["IMAGE", "VIDEO"] // Lista de tipos de conteúdo
    const encoded = Array(types.length).fill(0) // Vetor de zeros inicial
    const index = types.indexOf(type) // Índice do tipo de conteúdo
    if (index !== -1) encoded[index] = 1 // Define o índice correspondente como 1
    return encoded;    
}

export function normalizeDuration(duration: number): number {
    if(duration == 0) return 1
    else return duration / MAX_DURATION
}

export function encodeLanguage(language: string): number[] {
    const languages = ["pt-br", "en-us", "es-es"] // Lista de idiomas
    const encoded = Array(languages.length).fill(0) // Vetor de zeros inicial
    const index = languages.indexOf(language) // Índice do idioma
    if (index !== -1) encoded[index] = 1 // Define o índice correspondente como 1
    return encoded;
}

export function normalizeWatchTime(watchTime: number, duration: number): number {
    if(duration == 0) return watchTime
    else return watchTime / duration
}


export async function pre_processing (i: InteractionQueueProps){
    const tags: Tag[] = []
    await i.data.forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => { tags.push(tag) })
        }
    })

    const processed_interactions = i.data.map((item) => {
        return {
            id: item.id,
            user_id: item.userId,
            encode_content_type: encodeContentType(item.type),
            normalized_duration: normalizeDuration(item.duration),
            encoded_language: encodeLanguage(item.language),
            tags: item.tags? item.tags.map((item) => {return item.id}): [],
            interaction: {
                like: Number(item.interaction.liked),
                share: Number(item.interaction.shared),
                click_into_moment: Number(item.interaction.clickIntoMoment),
                watch_time: normalizeWatchTime(item.interaction.watchTime, item.duration),
                click_profile: Number(item.interaction.clickProfile),
                comment: Number(item.interaction.commented),
                like_comment: Number(item.interaction.likeComment),
                pass_to_next: Number(item.interaction.skipped),
                show_less_often: Number(item.interaction.showLessOften),
                report: Number(item.interaction.reported)
            }
        }
    })

    function calculeTagVector(tags: Tag[]): { tfidf: number, id: number }[] {
        const tagData: { [key: string]: { id: number, tf: number } } = {}
        tags.forEach((tag) => {
            if (!(tag.name in tagData)) tagData[tag.name] = { id: tag.id, tf: 0 }
            tagData[tag.name].tf++
        })
        return Object.keys(tagData).map(tagName => {
            const { id, tf } = tagData[tagName]
            const tagCount = tags.filter(t => t.name === tagName).length
            const tfidf = (tf / tags.length) * Math.log(tags.length / tagCount)
            return { tfidf, id }
        })
    }
    return {
        user_id: i.user_id,
        tags_vector: calculeTagVector(tags),
        processed_interactions, 
        moment_tags_ids_vector: processed_interactions.map((i) => {return {id: i.id, tags: i.tags.map((t) => {return {id: t}})}})
    }
}