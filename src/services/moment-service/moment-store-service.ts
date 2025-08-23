import { InternalServerError, ValidationError } from "../../errors"
import { StoreNewMomentsProps, TagProps } from "./types"
import { generateOptimizedThumbnails, generatePreviewThumbnail, processAndUploadVideo } from "../../utils/video"
import { processInteraction, processNewPost } from "../../swipe-engine/services"

import CONFIG from "../../config"
import { HEICtoJPEG } from "../../utils/image/conversor"
import Metadata from "../../models/moments/moment_metadata-model.js"
import Moment from "../../models/moments/moment-model"
import MomentMidia from "../../models/moments/moment_midia-model.js"
import PostEmbedding from "../../swipe-engine/models/PostEmbedding"
import { PostEmbeddingService } from "../../swipe-engine/core/embeddings/PostEmbeddingService"
import { RecommendationCoordinator } from "../../swipe-engine/core/recommendation/RecommendationCoordinator"
import SecurityToolKit from "security-toolkit"
import Statistic from "../../models/moments/moment_statistic-model.js"
import { Tag } from "../../helpers/tag"
import UserStatistic from "../../models/user/statistic-model"
import { getLogger } from "../../swipe-engine/core/utils/logger"
import { image_compressor } from "../../utils/image/compressor"
import { upload_image_AWS_S3 } from "../../utils/image/upload"

// Inicializar serviços
const postEmbeddingService = new PostEmbeddingService()
const logger = getLogger("moment-store-service")

export async function store_new_moment({ user_id, moment }: StoreNewMomentsProps) {
    let midia_base64
    let fullhd_aws_s3_url, nhd_aws_s3_url

    if (moment.metadata.file_type == "image/heic")
        midia_base64 = await HEICtoJPEG({ base64: moment.midia.base64 })
    else midia_base64 = moment.midia.base64

    const compressed_fullhd_base64 = await image_compressor({
        imageBase64: midia_base64,
        quality: 40,
        img_width: moment.metadata.resolution_width,
        resolution: "FULL_HD",
    })
    const compressed_nhd_base64 = await image_compressor({
        imageBase64: midia_base64,
        quality: 25,
        img_width: moment.metadata.resolution_width,
        resolution: "NHD",
    })

    fullhd_aws_s3_url = await upload_image_AWS_S3({
        imageBase64: compressed_fullhd_base64,
        bucketName: CONFIG.AWS_MIDIA_BUCKET,
        fileName: "fullhd_" + moment.metadata.file_name,
    })
    nhd_aws_s3_url = await upload_image_AWS_S3({
        imageBase64: compressed_nhd_base64,
        bucketName: CONFIG.AWS_MIDIA_BUCKET,
        fileName: "nhd_" + moment.metadata.file_name,
    })

    const sanitization = new SecurityToolKit().sanitizerMethods.sanitizeSQLInjection(
        moment.description
    )

    if (sanitization.isDangerous) {
        throw new ValidationError({
            message:
                "Characters that are considered malicious have been identified in the description.",
            action: 'Please remove characters like "]})*&',
        })
    }

    const new_moment = await Moment.create({
        user_id: user_id,
        description: sanitization.sanitized,
        visible: true,
        blocked: false,
    })

    await UserStatistic.increment("total_moments_num", { by: 1, where: { user_id } })
    // @ts-ignore
    await MomentMidia.create({
        moment_id: new_moment.id,
        content_type: moment.midia.content_type,
        fullhd_resolution: fullhd_aws_s3_url,
        nhd_resolution: nhd_aws_s3_url,
    })
    // @ts-ignore
    await Statistic.create({ moment_id: new_moment.id })
    // @ts-ignore
    await Metadata.create({
        moment_id: new_moment.id,
        duration: Math.trunc(moment.metadata.duration),
        file_name: moment.metadata.file_name,
        file_size: Math.trunc(moment.metadata.file_size),
        file_type: moment.metadata.file_type,
        resolution_width: Math.trunc(moment.metadata.resolution_width),
        resolution_height: Math.trunc(moment.metadata.resolution_height),
    })
    
    // Sanitizar tags individualmente
    const sanitizedTags = moment.tags.map((tag: TagProps) => {
        const tagSanitization = new SecurityToolKit().sanitizerMethods.sanitizeSQLInjection(tag.title)
        if (tagSanitization.isDangerous) {
            throw new ValidationError({
                message: `Tag considerada maliciosa: ${tag.title}`,
                action: 'Remova caracteres como "]})*& nas tags.'
            })
        }
        return { ...tag, title: tagSanitization.sanitized }
    })
    
    // Processar tags
    await Tag.AutoAdd({ moment_id: new_moment.id, tags: sanitizedTags })
    
    try {
        logger.info(`Gerando embedding para novo momento ${new_moment.id}`)
        
        // Extrair tags para o embedding
        const tagTitles = sanitizedTags.map((tag: TagProps) => tag.title)
        
        // Gerar embedding para o novo momento
        const embeddingData = {
            textContent: sanitization.sanitized,
            tags: tagTitles,
            engagementMetrics: {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                saves: 0,
                engagementRate: 0
            },
            authorId: BigInt(user_id),
            createdAt: new Date()
        }
        
        // Gerar embedding
        const embedding = await postEmbeddingService.build(embeddingData)
        
        // Salvar embedding no banco de dados
        await PostEmbedding.upsert({
            postId: new_moment.id.toString(),
            vector: JSON.stringify(embedding.values),
            dimension: embedding.dimension,
            metadata: embedding.metadata || {}
        })
        
        // Associar o momento a clusters apropriados usando o serviço da API
        try {
            logger.info(`Processando momento ${new_moment.id} para atribuição a clusters`)
            await processNewPost(new_moment.id)
            logger.info(`Momento ${new_moment.id} processado e atribuído a clusters`)
        } catch (clusterError) {
            logger.warn(`Não foi possível atribuir o momento ${new_moment.id} a clusters: ${clusterError}`)
        }
        
    } catch (error) {
        logger.error(`Erro ao processar embedding para momento ${new_moment.id}: ${error}`)
        // Não lançamos erro para não interromper o fluxo principal
    }
    
    return new_moment
}

export async function store_moment_interaction({
    interaction,
    user_id,
    moment_id,
}: {
    interaction: any
    user_id: bigint
    moment_id: bigint
}) {
    try {
        const moment = await Moment.findOne({
            where: { id: moment_id },
        })

        if (!moment)
            throw new InternalServerError({
                message: "This moment does not exist.",
                action: "Make sure the ID was passed correctly.",
            })
        if (moment.deleted)
            throw new InternalServerError({
                message: "This moment has already been previously deleted",
                action: "Make sure this moment has visible to be interacted.",
            })
        // Processar a interação (adaptado para a nova estrutura)
        try {
            const momentOwnerId = moment.user_id
            await processInteraction(user_id, moment_id, interaction.type, {
                momentOwnerId,
                details: interaction
            })
        } catch (error) {
            logger.error(`Erro ao processar interação com o momento ${moment_id}: ${error}`)
            console.log(error)
        }
    } catch (err) {
        throw new InternalServerError({
            message: "error when searching for moments in swipe-engine-api",
        })
    }
}

export async function store_new_moment_video({ user_id, moment }: StoreNewMomentsProps) {
    let fullhd_video_aws_s3_url
    let preview_thumbnail_aws_s3_url

    try {
        // Processar vídeo - conversão, compressão e upload (apenas FULL_HD, máx 30s)
        const videoProcessingResult = await processAndUploadVideo({
            videoBase64: moment.midia.base64,
            fileName: moment.metadata.file_name,
            bucketName: CONFIG.AWS_VIDEO_BUCKET,
            options: {
                compressionLevel: "high",
                targetSizeMB: 50, // Limite de 50MB para vídeos
                maxDurationSeconds: 30, // Máximo 30 segundos
                // Forçar resolução máxima FULL_HD
                // O compressor já limita para 1920x1080 em 'high', mas garantimos aqui
                // Se o vídeo for maior, será redimensionado
                // O processador/conversor já trata scale, mas pode ser reforçado no compressor
                // Se quiser garantir, pode passar um parâmetro extra para scale
            }
        })

        fullhd_video_aws_s3_url = videoProcessingResult.uploadResult.url

        // Gerar thumbnail de preview (primeiro frame, 280p)
        const previewThumbnail = await generatePreviewThumbnail({
            videoBase64: moment.midia.base64,
            timeOffset: 0.1 // quase início
        })

        // Compressão do preview
        const compressed_preview_thumbnail = await image_compressor({
            imageBase64: previewThumbnail.thumbnailBase64,
            quality: 50,
            img_width: previewThumbnail.width,
            resolution: "PREVIEW",
            isMoment: true
        })

        // Upload do preview para S3
        preview_thumbnail_aws_s3_url = await upload_image_AWS_S3({
            imageBase64: compressed_preview_thumbnail,
            bucketName: CONFIG.AWS_VIDEO_PREVIEW_BUCKET,
            fileName: "preview_" + moment.metadata.file_name.replace(/\.[^/.]+$/, ".jpg"),
        })

        // Sanitizar descrição
        const sanitization = new SecurityToolKit().sanitizerMethods.sanitizeSQLInjection(
            moment.description
        )

        if (sanitization.isDangerous) {
            throw new ValidationError({
                message:
                    "Characters that are considered malicious have been identified in the description.",
                action: 'Please remove characters like "]})*&',
            })
        }

        // Criar momento no banco de dados
        const new_moment = await Moment.create({
            user_id: user_id,
            description: sanitization.sanitized,
            visible: true,
            blocked: false,
        })

        await UserStatistic.increment("total_moments_num", { by: 1, where: { user_id } })

        // Criar registro de mídia do vídeo
        // @ts-ignore
        await MomentMidia.create({
            moment_id: new_moment.id,
            content_type: moment.midia.content_type, // "VIDEO"
            fullhd_resolution: fullhd_video_aws_s3_url,
            preview_thumbnail: preview_thumbnail_aws_s3_url,
        })

        // @ts-ignore
        await Statistic.create({ moment_id: new_moment.id })

        // @ts-ignore
        await Metadata.create({
            moment_id: new_moment.id,
            duration: Math.trunc(moment.metadata.duration),
            file_name: moment.metadata.file_name,
            file_size: Math.trunc(videoProcessingResult.uploadResult.size / (1024 * 1024)), // Converter para MB
            file_type: "video/mp4", // Sempre MP4 após processamento
            resolution_width: Math.trunc(moment.metadata.resolution_width),
            resolution_height: Math.trunc(moment.metadata.resolution_height),
        })

        // Sanitizar tags individualmente
        const sanitizedTags = moment.tags.map((tag: TagProps) => {
            const tagSanitization = new SecurityToolKit().sanitizerMethods.sanitizeSQLInjection(tag.title)
            if (tagSanitization.isDangerous) {
                throw new ValidationError({
                    message: `Tag considerada maliciosa: ${tag.title}`,
                    action: 'Remova caracteres como "]})*& nas tags.'
                })
            }
            return { ...tag, title: tagSanitization.sanitized }
        })
        
        // Processar tags
        await Tag.AutoAdd({ moment_id: new_moment.id, tags: sanitizedTags })

        try {
            logger.info(`Gerando embedding para novo momento de vídeo ${new_moment.id}`)
            
            // Extrair tags para o embedding
            const tagTitles = sanitizedTags.map((tag: TagProps) => tag.title)
            
            // Gerar embedding para o novo momento de vídeo
            const embeddingData = {
                textContent: sanitization.sanitized,
                tags: tagTitles,
                engagementMetrics: {
                    views: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    saves: 0,
                    engagementRate: 0
                },
                authorId: BigInt(user_id),
                createdAt: new Date()
            }
            
            // Gerar embedding
            const embedding = await postEmbeddingService.build(embeddingData)
            
            // Salvar embedding no banco de dados
            await PostEmbedding.upsert({
                postId: new_moment.id.toString(),
                vector: JSON.stringify(embedding.values),
                dimension: embedding.dimension,
                metadata: embedding.metadata || {}
            })
            
            // Associar o momento a clusters apropriados
            try {
                logger.info(`Processando momento de vídeo ${new_moment.id} para atribuição a clusters`)
                await processNewPost(new_moment.id)
                logger.info(`Momento de vídeo ${new_moment.id} processado e atribuído a clusters`)
            } catch (clusterError) {
                logger.warn(`Não foi possível atribuir o momento de vídeo ${new_moment.id} a clusters: ${clusterError}`)
            }
            
        } catch (error) {
            logger.error(`Erro ao processar embedding para momento de vídeo ${new_moment.id}: ${error}`)
            // Não lançamos erro para não interromper o fluxo principal
        }

        logger.info(`Momento de vídeo ${new_moment.id} criado com sucesso`)
        logger.info(`Vídeo processado: ${videoProcessingResult.processingStats.compressionRatio}% de compressão`)
        
        return new_moment

    } catch (error: any) {
        logger.error(`Erro ao criar momento de vídeo: ${error.message}`)
        throw new InternalServerError({
            message: `Erro ao processar momento de vídeo: ${error.message}`,
            action: "Verifique o formato do vídeo e tente novamente."
        })
    }
}
