import {
    FindMomentStatisticsViewProps,
    FindMomentTagsProps,
    FindUserFeedMomentsProps,
    FindUserMomentsProps,
    FindUserMomentsTinyExcludeMemoryProps,
    MomentProps,
    UserType,
} from "./types"
import { InternalServerError, UnauthorizedError } from "../../errors"

import Comment from "../../models/comments/comment-model"
import CommentLike from "../../models/comments/comment_likes-model"
import CommentStatistic from "../../models/comments/comment_statistics-model"
import Like from "../../models/moments/like-model"
import MemoryMoment from "../../models/memories/memory_moments-model"
import Moment from "../../models/moments/moment-model"
import MomentTags from "../../models/moments/moment_tag-model"
import { Op } from "sequelize"
import { FeedRecommendationParams as Params } from "../../swipe-engine/params"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/moments/moment_statistic-model"
import Tag from "../../models/tags/tag-model"
import User from "../../models/user/user-model"
import { getLogger } from "../../swipe-engine/core/utils/logger"
import { getRecommendations } from "../../swipe-engine/services"
import { populateMoment } from "../../helpers/populate-moments"
import { processResponseItems } from "./processResponseItems"

// Logger para o serviço de feed
const logger = getLogger("moment-find-service")

// Função para enriquecer resultados do feed com métricas de recomendação
async function enrichFeedResults(results, recommendations, userId) {
    if (!results || !recommendations || results.length === 0) {
        return results;
    }

    // Mapear recomendações por ID para acesso rápido
    const recMap = new Map();
    recommendations.forEach(rec => {
        recMap.set(rec.entityId.toString(), rec);
    });

    // Enriquecer cada momento com informações de recomendação
    return results.map(moment => {
        const rec = recMap.get(moment.id.toString());
        if (rec) {
            // Adicionar métricas de recomendação ao momento
            return {
                ...moment,
                recommendation: {
                    score: rec.score,
                    relevance: rec.metadata?.relevance || 0,
                    recency: rec.metadata?.recency || 0,
                    popularity: rec.metadata?.popularity || 0,
                }
            };
        }
        return moment;
    });
}

export async function find_user_feed_moments({ user_id, interaction_queue = [] }: FindUserFeedMomentsProps) {
    try {
        logger.info(`Gerando feed personalizado para usuário ${user_id}`)
        
        // Processar interações recentes que ainda não foram rastreadas
        if (interaction_queue && interaction_queue.length > 0) {
            logger.info(`Processando ${interaction_queue.length} interações pendentes`)
            // Comentado temporariamente até que a funcionalidade esteja disponível
            /*
            for (const interaction of interaction_queue) {
                try {
                    await trackUserInteraction(user_id, {
                        entityId: interaction.entity_id,
                        entityType: interaction.entity_type,
                        type: interaction.type,
                        timestamp: interaction.timestamp || new Date().toISOString(),
                        metadata: interaction.metadata || {}
                    })
                } catch (err) {
                    logger.error(`Erro ao processar interação: ${err}`)
                    // Continuar processando as outras interações mesmo se uma falhar
                }
            }
            */
        }

        // Configurar contexto de recomendação com mais informações
        const now = new Date()
        const recommendationOptions = {
            ...Params.defaultOptions,
            context: {
                timeOfDay: now.getHours(),
                dayOfWeek: now.getDay(),
                weekday: now.getDay() >= 1 && now.getDay() <= 5,
                weekend: now.getDay() === 0 || now.getDay() === 6,
                morning: now.getHours() >= 5 && now.getHours() < 12,
                afternoon: now.getHours() >= 12 && now.getHours() < 18,
                evening: now.getHours() >= 18 && now.getHours() < 22,
                night: now.getHours() >= 22 || now.getHours() < 5,
                timestamp: now.toISOString()
            },
            diversityWeight: 0.3, // Aumentar diversidade de conteúdo
            recencyWeight: 0.4,   // Priorizar conteúdo recente
            relevanceWeight: 0.3, // Manter relevância para o usuário
            limit: 30,            // Número de recomendações a retornar
            excludeViewed: true,  // Excluir conteúdos já vistos
            excludeIds: [],       // IDs para excluir especificamente
        }

        // Obter recomendações do swipe engine
        logger.info(`Solicitando recomendações com parâmetros: ${JSON.stringify(recommendationOptions)}`)
        const recommendations = await getRecommendations(user_id, recommendationOptions)
        
        // Registrar estatísticas de recomendação
        logger.info(`Recebidas ${recommendations.length} recomendações para o usuário ${user_id}`)
        
        // Extrair IDs dos momentos recomendados
        const moment_ids = recommendations
            .filter((rec) => rec.entityType === "post") // Filtra apenas por posts
            .map((rec) => rec.entityId.toString())
        
        // Se não houver recomendações, retornar array vazio
        if (moment_ids.length === 0) {
            logger.warn(`Nenhum momento recomendado para o usuário ${user_id}`)
            return []
        }

        // Processar e retornar os itens recomendados
        const results = await processResponseItems(moment_ids, user_id)
        
        // Enriquecer resultados com informações de recomendação
        const enrichedResults = await enrichFeedResults(results, recommendations, user_id);
        
        logger.info(`Retornando ${enrichedResults.length} momentos processados para o usuário ${user_id}`)
        
        return enrichedResults
    } catch (err) {
        logger.error(`Erro ao obter recomendações: ${err}`)
        throw new InternalServerError({
            message: "Falha ao obter recomendações de conteúdo"
        })
    }
}

export async function find_user_moments({
    user_id,
    page,
    pageSize,
    finded_user_pk,
}: FindUserMomentsProps) {
    try {
        const offset = (page - 1) * pageSize
        const { count, rows: moments } = await Moment.findAndCountAll({
            where: { user_id: finded_user_pk, visible: true, blocked: false },
            attributes: ["id", "description"],
            order: [["created_at", "DESC"]],
            limit: pageSize,
            offset,
        })

        const totalPages = Math.ceil(count / pageSize)

        const populated_moments = await Promise.all(
            moments.map(async (moment) => {
                const momentData = await populateMoment({
                    moment_id: moment.id,
                    tags: true,
                    statistic: true,
                    metadata: true,
                })

                const liked = await Like.findOne({
                    where: { user_id, liked_moment_id: moment.id },
                })

                return {
                    ...momentData,
                    is_liked: Boolean(liked),
                }
            })
        )

        const filteredMoments = populated_moments.filter((moment) => {
            return moment.deleted === false && moment.visible === true && moment.blocked === false
        })

        return {
            moments: filteredMoments,
            totalPages,
            currentPage: page,
            pageSize,
        }
    } catch (error: any) {
        // Lidar com erros de forma apropriada (por exemplo, lançar, logar ou retornar um erro padronizado)
        throw new Error("Erro ao buscar momentos do usuário: " + error.message)
    }
}

export async function find_user_moments_tiny({
    user_id,
    finded_user_pk,
    page,
    pageSize,
}: FindUserMomentsProps) {
    try {
        const offset = (page - 1) * pageSize
        const { count, rows: moments } = await Moment.findAndCountAll({
            where: { user_id: finded_user_pk, visible: true, blocked: false },
            attributes: ["id"],
            order: [["created_at", "DESC"]],
            limit: pageSize,
            offset,
        })

        const totalPages = Math.ceil(count / pageSize)

        const populated_moments = await Promise.all(
            moments.map(async (moment) => {
                const populated_moment: MomentProps = await populateMoment({
                    moment_id: moment.id,
                    midia: true,
                })

                const liked = await Like.findOne({
                    where: { user_id, liked_moment_id: moment.id },
                })

                return {
                    id: populated_moment.id,
                    midia: {
                        content_type: populated_moment.midia.content_type,
                        nhd_resolution: populated_moment.midia.nhd_resolution,
                    },
                    visible: populated_moment.visible,
                    deleted: populated_moment.deleted,
                    blocked: populated_moment.blocked,
                    is_liked: Boolean(liked),
                }
            })
        )

        const filteredMoments = populated_moments.filter((moment) => {
            return moment.deleted === false && moment.visible === true && moment.blocked === false
        })

        const cleanedMoments = filteredMoments.map((moment) => {
            return {
                id: moment.id,
                midia: moment.midia,
                is_liked: moment.is_liked,
            }
        })

        return {
            moments: cleanedMoments,
            totalPages,
            currentPage: page,
            pageSize,
        }
    } catch (error: any) {
        // Lidar com erros de forma apropriada (por exemplo, lançar, logar ou retornar um erro padronizado)
        throw new Error("Erro ao buscar momentos do usuário: " + error.message)
    }
}

export async function find_user_moments_tiny_exclude_memory({
    user_id,
    memory_id,
}: FindUserMomentsTinyExcludeMemoryProps) {
    try {
        const memory_moments = await MemoryMoment.findAll({
            where: { memory_id: memory_id.toString() },
        })
        console.log(memory_moments)
        const memoryMomentsIds = memory_moments.map((i: any) => i.moment_id.toString())

        const moments = await Moment.findAll({
            where: {
                user_id,
                visible: true,
                blocked: false,
                id: {
                    [Op.notIn]: memoryMomentsIds,
                },
            },
            attributes: ["id"],
            order: [["created_at", "DESC"]],
        })

        const populated_moments = await Promise.all(
            moments.map(async (moment) => {
                const populated_moment: MomentProps = await populateMoment({
                    moment_id: moment.id,
                    midia: true,
                })

                return {
                    id: populated_moment.id,
                    midia: {
                        content_type: populated_moment.midia.content_type,
                        nhd_resolution: populated_moment.midia.nhd_resolution,
                    },
                    visible: populated_moment.visible,
                    deleted: populated_moment.deleted,
                    blocked: populated_moment.blocked,
                }
            })
        )

        const filteredMoments = populated_moments.filter((moment) => {
            return moment.deleted === false && moment.visible === true && moment.blocked === false
        })

        const cleanedMoments = filteredMoments.map((moment) => {
            return {
                id: moment.id,
                midia: moment.midia,
            }
        })

        return cleanedMoments
    } catch (error: any) {
        // Lidar com erros de forma apropriada (por exemplo, lançar, logar ou retornar um erro padronizado)
        throw new Error("Erro ao buscar momentos do usuário: " + error.message)
    }
}

export async function find_moment_comments({ moment_id, user_id, page, pageSize }) {
    const offset = (page - 1) * pageSize

    // @ts-ignore
    const { count, rows: comments } = await Comment.findAndCountAll({
        where: { moment_id },
        attributes: ["id", "content", "createdAt"],
        order: [["createdAt", "DESC"]], // Corrigido o nome do campo para "createdAt"
        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "username", "verifyed"],
                include: [
                    {
                        model: ProfilePicture,
                        as: "profile_pictures",
                        attributes: ["tiny_resolution"],
                    },
                ],
            },
            {
                model: CommentStatistic,
                as: "comment_statistic",
                attributes: ["total_likes_num"],
            },
        ],
        limit: pageSize,
        offset,
    })

    const comments_formatted = await Promise.all(
        comments.map(async (comment: any) => {
            // @ts-ignore
            const liked = await CommentLike.findOne({
                where: { user_id, comment_id: comment.id },
            })
            return {
                id: comment.id,
                content: comment.content,
                user: {
                    id: comment.user.id,
                    username: comment.user.username,
                    verifyed: comment.user.verifyed,
                    profile_picture: {
                        tiny_resolution: comment.user.profile_pictures?.tiny_resolution,
                    }, // Corrigido para pegar a resolução correta
                },
                is_liked: Boolean(liked),
                statistics: comment.comment_statistic,
                created_at: comment.createdAt,
            }
        })
    )

    const totalPages = Math.ceil(count / pageSize)

    return {
        comments: comments_formatted,
        count,
        totalPages,
        currentPage: page,
        pageSize,
    }
}

export async function find_moment_statistics_view({
    moment_id,
    user_id,
}: FindMomentStatisticsViewProps) {
    // @ts-ignore
    const statistic = (await Statistic.findOne({
        where: { moment_id },
        attributes: [
            "total_likes_num",
            "total_views_num",
            "total_shares_num",
            "total_comments_num",
            "moment_id",
        ],
    })) as any

    const moment_from_statistic = await Moment.findOne({
        where: { id: statistic.moment_id },
        attributes: ["user_id", "id"],
    })

    if (!moment_from_statistic)
        throw new InternalServerError({ message: "Error to find moment from statistic." })

    if (moment_from_statistic.user_id !== user_id)
        throw new UnauthorizedError({
            message: "Only the user who owns that moment can view their statistics.",
            action: "Check if this user is the creator of the moment.",
        })

    return {
        total_likes_num: statistic.total_likes_num,
        total_views_num: statistic.total_views_num,
        total_shares_num: statistic.total_shares_num,
        total_comments_num: statistic.total_comments_num,
    }
}
export async function find_moment_tags({ moment_id }: FindMomentTagsProps) {
    // @ts-ignore
    const tags_arr = await MomentTags.findAll({
        where: { moment_id },
        attributes: [],
        include: [
            {
                model: Tag,
                as: "tag",
                attributes: ["id", "title"],
            },
        ],
    })
    return tags_arr.map((i: any) => {
        return { id: i.tag.id, title: i.tag.title }
    })
}

// Interface para feedback de recomendação
interface RecommendationFeedbackProps {
    user_id: string | bigint;
    moment_id: string | bigint;
    feedback_type: 'like' | 'dislike' | 'not_interested' | 'save' | 'share';
    timestamp?: string;
}

/**
 * Processa feedback explícito do usuário sobre uma recomendação
 * Útil para melhorar o algoritmo de recomendação com o tempo
 */
export async function process_recommendation_feedback({
    user_id,
    moment_id,
    feedback_type,
    timestamp
}: RecommendationFeedbackProps) {
    try {
        logger.info(`Processando feedback de recomendação: usuário ${user_id}, momento ${moment_id}, tipo ${feedback_type}`)
        
        // Verificar se o momento existe
        const moment = await Moment.findOne({
            where: { id: moment_id.toString() },
            attributes: ['id', 'user_id']
        })
        
        if (!moment) {
            logger.warn(`Momento ${moment_id} não encontrado para feedback`)
            return { success: false, message: "Momento não encontrado" }
        }
        
        // Registrar o feedback no log
        logger.info(`Feedback registrado: ${feedback_type} para momento ${moment_id} pelo usuário ${user_id}`)
        
        // Conforme o tipo de feedback, podemos realizar ações diferentes
        if (feedback_type === 'like') {
            // Adicionar registro de like em uma implementação futura
            logger.info(`Like registrado para momento ${moment_id}`);
        } else if (feedback_type === 'dislike' || feedback_type === 'not_interested') {
            // Registrar conteúdo não interessante em uma implementação futura
            logger.info(`Usuário ${user_id} não tem interesse no momento ${moment_id}`);
        } else if (feedback_type === 'save' || feedback_type === 'share') {
            // Registrar salvamento/compartilhamento em uma implementação futura
            logger.info(`Usuário ${user_id} ${feedback_type === 'save' ? 'salvou' : 'compartilhou'} o momento ${moment_id}`);
        }
        
        return {
            success: true,
            message: `Feedback '${feedback_type}' registrado com sucesso`
        }
    } catch (err) {
        logger.error(`Erro ao processar feedback de recomendação: ${err}`)
        throw new InternalServerError({
            message: "Falha ao processar feedback de recomendação"
        })
    }
}
