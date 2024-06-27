import { InternalServerError } from "../../errors"
import { Tag } from "../../helpers/tag"
import { FindMemoryProps, FindUserMemoriesProps, FindMemoryMomentsProps} from "./types"
import Memory from '../../models/memories/memory-model.js'
import MemoryMoment from '../../models/memories/memory_moments-model.js'
import MomentStatistic from '../../models/moments/moment_statistic-model.js'
import MomentMetadata from '../../models/moments/moment_metadata-model.js'
import MomentMidia from '../../models/moments/moment_midia-model.js'
import Moment from '../../models/moments/moment-model.js'
import UserStatistic from '../../models/user/statistic-model.js'
import { populateMoment } from "../../helpers/populate-moments"

export async function find_memory_moments ({memory_id, page, pageSize}: FindMemoryMomentsProps){
    try {
        const offset = (page - 1) * pageSize
        const { count, rows: memory_moments } = await MemoryMoment.findAndCountAll({
            where: { memory_id: memory_id },
            attributes: ['created_at', 'moment_id'],
            include: [
                {
                    model: Moment,
                    as: 'moment', // Especifique o alias aqui de acordo com o relacionamento em Memory
                    attributes: { exclude: ['user_id', 'updated_at']},
                    include: [
                        {
                            model: MomentMidia,
                            as: 'moment_midias', // Especifique o alias aqui de acordo com o relacionamento em Memory
                            attributes: ['content_type', 'nhd_resolution', 'fullhd_resolution'],
                        },
                        {
                            model: MomentStatistic,
                            as: 'moment_statistics', // Especifique o alias aqui de acordo com o relacionamento em Memory
                            attributes: ['total_likes_num'],
                        },
                    ]
                }
            ],
            offset: offset,
            limit: pageSize,
            order: [['created_at', 'DESC']],

        })

        const filter2 = memory_moments.map((item) => {
            return {
                id: item.moment.id,
                description: item.moment.description,
                visible: item.moment.visible,
                deleted: item.moment.deleted,
                blocked: item.moment.blocked,
                created_at: item.moment.createdAt,
                updated_at: item.moment.updatedAt,
                midia: {
                    content_type: item.moment.moment_midias.content_type,
                    nhd_resolution: item.moment.moment_midias.nhd_resolution,
                    fullhd_resolution: item.moment.moment_midias.fullhd_resolution
                },
                statistics: {
                    total_likes_num: item.moment.moment_statistics.total_likes_num
                }
            }
        })
        const populated_moments = await Promise.all(
            memory_moments.map(async (memory_moment) => {
            return await populateMoment({
                moment_id: memory_moment.moment_id,
                statistic: true,
            })
        }))

        const filteredMoments = filter2.filter((moment) => {
            return moment.deleted === false && moment.visible === true && moment.blocked === false;
        });
        filteredMoments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        const totalPages = Math.ceil(count / pageSize);
        return {
            data: filteredMoments,
            count,
            totalPages,
            currentPage: page,
            pageSize,
        }

    }catch(err: any) {
        throw new InternalServerError({ message: err.message })
    }
}

export async function find_memory_moments_id ({ memory_id}: FindMemoryProps) {
    try{
        const memory_moments = await MemoryMoment.findAll({
            where: { memory_id: memory_id },
            attributes: ['moment_id'],
        })

        return memory_moments.map((item) => {return item.moment_id})
    } catch(err: any) {
        throw new InternalServerError({ message: err.message })
    } 
}

export async function find_memory ({ memory_id}: FindMemoryProps) {
    try{
        const memory = await Memory.findOne({
            where: {id: memory_id},
            attributes: [ 'id', 'title']
        })
        return {
            id: memory.id,
            title: memory.title, 
        }
    } catch(err: any) {
        throw new InternalServerError({ message: err.message })
    } 
}

export async function find_user_memories({ user_id, page, pageSize }: FindUserMemoriesProps) {
    try {
        const offset = (page - 1) * pageSize;
        const { count, rows: memories } = await Memory.findAndCountAll({
            where: { user_id },
            order: [['updated_at', 'DESC']],
            limit: pageSize,
            offset,
        });
        const totalPages = Math.ceil(count / pageSize);

        const userStatistic = await UserStatistic.findOne({
            where: { user_id },
            attributes: ['total_memories_num']
        });

        const transformedOutput = await Promise.all(
            memories.map(async (memory) => {
                const memoryMoments = await MemoryMoment.findAll({
                    where: { memory_id: memory.id },
                });

                const moments = await Promise.all(
                    memoryMoments.map(async (memory_moment) => {
                        return await populateMoment({
                            moment_id: memory_moment.moment_id,
                            statistic: true,
                        });
                    })
                );

                moments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                const filteredMoments = moments.filter((moment) => {
                    return moment.deleted === false && moment.visible === true && moment.blocked === false;
                });
                const slicedMoment = filteredMoments.slice(0, 3);

                if (slicedMoment.length !== 0) {
                    return {
                        id: memory.id,
                        title: memory.title,
                        updated_at: slicedMoment.length > 0 ? slicedMoment[0].created_at : memory.updated_at,
                        moments: slicedMoment,
                    };
                }
                return null; // Retornar null se a memória não tiver momentos válidos
            })
        );

        // Filtra memórias que não são nulas
        const filteredOutput = transformedOutput.filter((memory) => memory !== null);

        // Ordena memórias filtradas
        filteredOutput.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        return {
            memories: filteredOutput,
            count: userStatistic.total_memories_num,
            totalPages,
            currentPage: page,
            pageSize,
        };
    } catch (err: any) {
        throw new InternalServerError({ message: err.message });
    }
}
