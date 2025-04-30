import { InternalServerError } from "../errors"
import Moment from "../models/moments/moment-model"
import Metadata from "../models/moments/moment_metadata-model.js"
import MomentMidia from "../models/moments/moment_midia-model.js"
import Statistic from "../models/moments/moment_statistic-model.js"
import MomentTag from "../models/moments/moment_tag-model.js"
import Tag from "../models/tags/tag-model"

// Tipos para as opções de população
interface PopulateMomentsOptions {
    moment_id: bigint
    stats?: boolean
    metadata?: boolean
    midia?: boolean
    statistic?: boolean
    comments?: boolean
    tags?: boolean
    attributes?: string[]
}

// Interfaces para cada tipo de dado
interface MomentStats {
    visible: boolean
    deleted: boolean
    blocked: boolean
}

interface MomentMetadata {
    [key: string]: any // Tipagem específica baseada no seu modelo
}

interface MomentMidiaData {
    content_type: string
    nhd_resolution: string
    fullhd_resolution: string
}

interface MomentStatistic {
    total_likes_num: number
}

interface MomentTag {
    id: number
    title: string
}

// Interface para o resultado
interface PopulatedMoment {
    id: bigint
    description: string
    created_at: string
    stats?: MomentStats
    metadata?: MomentMetadata
    midia?: MomentMidiaData
    statistics?: MomentStatistic
    tags?: MomentTag[]
}

export async function populateMoment({
    moment_id,
    stats = true,
    metadata = false,
    midia = true,
    statistic = false,
    tags = false,
    attributes = ["id", "description", "createdAt"],
}: PopulateMomentsOptions): Promise<PopulatedMoment> {
    try {
        // Busca dados básicos do momento
        const moment = await Moment.findOne({
            where: { id: moment_id },
            attributes,
        })

        if (!moment) {
            throw new InternalServerError({
                message: `Momento não encontrado: ${moment_id}`,
                details: { moment_id },
            })
        }

        // Inicializa o objeto de retorno com dados básicos
        const momentData: PopulatedMoment = {
            id: moment.id,
            description: moment.description,
            created_at: moment.createdAt,
        }

        // Carrega dados em paralelo para melhor performance
        const loadPromises: Promise<void>[] = []

        if (stats) {
            loadPromises.push(
                (async () => {
                    const momentStats = await Moment.findOne({
                        where: { id: moment_id },
                        attributes: ["visible", "deleted", "blocked"],
                    })
                    if (!momentStats) {
                        throw new InternalServerError({
                            message: "Estatísticas do momento não encontradas",
                            details: { moment_id },
                        })
                    }
                    momentData.stats = {
                        visible: momentStats.visible,
                        deleted: momentStats.deleted,
                        blocked: momentStats.blocked,
                    }
                })()
            )
        }

        if (metadata) {
            loadPromises.push(
                (async () => {
                    const metadataResult = await Metadata.findOne({
                        where: { moment_id },
                        attributes: { exclude: ["createdAt", "updatedAt", "id", "moment_id"] },
                    })
                    momentData.metadata = metadataResult?.toJSON()
                })()
            )
        }

        if (midia) {
            loadPromises.push(
                (async () => {
                    const midiaResult = await MomentMidia.findOne({
                        where: { moment_id },
                        attributes: ["content_type", "nhd_resolution", "fullhd_resolution"],
                    })
                    momentData.midia = midiaResult?.toJSON()
                })()
            )
        }

        if (statistic) {
            loadPromises.push(
                (async () => {
                    const statisticResult = await Statistic.findOne({
                        where: { moment_id },
                        attributes: ["total_likes_num"],
                    })
                    momentData.statistics = statisticResult?.toJSON()
                })()
            )
        }

        if (tags) {
            loadPromises.push(
                (async () => {
                    const tagsResult = await MomentTag.findAll({
                        where: { moment_id },
                        include: [
                            {
                                model: Tag,
                                as: "tag",
                                attributes: ["title", "id"],
                            },
                        ],
                        attributes: [],
                    })
                    momentData.tags = tagsResult.map((momentTag) => ({
                        id: momentTag.tag.id,
                        title: momentTag.tag.title,
                    }))
                })()
            )
        }

        // Aguarda todas as promises serem resolvidas
        await Promise.all(loadPromises)

        return momentData
    } catch (error) {
        console.error("Erro ao popular momento:", error)
        throw new InternalServerError({
            message: "Erro ao carregar dados do momento",
            details: { moment_id, error: error.message },
        })
    }
}

// Exemplo de uso:
/*
const moment = await populateMoment({
    moment_id: BigInt(123),
    stats: true,
    metadata: true,
    midia: true,
    statistic: true,
    tags: true,
    attributes: ["id", "description", "createdAt", "customField"]
})
*/
