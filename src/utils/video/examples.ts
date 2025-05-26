import {
    DEFAULT_VIDEO_CONFIG,
    QUALITY_PRESETS,
    getVideoInfo,
    processAndUploadVideo
} from "./index"

// Exemplo 1: Processamento básico de vídeo
export async function basicVideoProcessing(videoBase64: string) {
    try {
        // Obter informações do vídeo antes do processamento
        const videoInfo = getVideoInfo(videoBase64)
        console.log("Informações do vídeo:", videoInfo)

        // Processar e fazer upload com configurações padrão
        const result = await processAndUploadVideo({
            videoBase64,
            fileName: "meu_video.mov",
            bucketName: "meu-bucket-videos",
            options: {
                compressionLevel: "medium"
            }
        })

        console.log("Upload concluído:", result.uploadResult.url)
        console.log("Estatísticas:", result.processingStats)
        
        return result
    } catch (error) {
        console.error("Erro no processamento:", error)
        throw error
    }
}

// Exemplo 2: Processamento para redes sociais
export async function socialMediaVideoProcessing(videoBase64: string) {
    try {
        const result = await processAndUploadVideo({
            videoBase64,
            fileName: "video_social.mp4",
            bucketName: "social-media-videos",
            options: {
                compressionLevel: QUALITY_PRESETS.social.compressionLevel,
                targetSizeMB: QUALITY_PRESETS.social.targetSizeMB,
                maxDurationSeconds: QUALITY_PRESETS.social.maxDurationSeconds
            }
        })

        return result
    } catch (error) {
        console.error("Erro no processamento para redes sociais:", error)
        throw error
    }
}

// Exemplo 3: Conversão de vídeo iPhone (MOV) para MP4
export async function iPhoneVideoConversion(videoBase64: string) {
    try {
        const result = await processAndUploadVideo({
            videoBase64,
            fileName: "video_iphone.mov",
            bucketName: "converted-videos",
            options: {
                inputFormat: "mov",
                compressionLevel: "high",
                targetSizeMB: 30
            }
        })

        console.log(`Vídeo convertido de MOV para MP4`)
        console.log(`Tamanho original: ${result.processingStats.originalSizeMB}MB`)
        console.log(`Tamanho final: ${result.processingStats.compressedSizeMB}MB`)
        console.log(`Redução: ${result.processingStats.compressionRatio}%`)

        return result
    } catch (error) {
        console.error("Erro na conversão do vídeo iPhone:", error)
        throw error
    }
}

// Exemplo 4: Processamento adaptativo baseado no tamanho
export async function adaptiveVideoProcessing(videoBase64: string) {
    try {
        // Primeiro, verificar o tamanho do vídeo
        const videoInfo = getVideoInfo(videoBase64)
        
        let compressionLevel: "low" | "medium" | "high" | "ultra" | "adaptive" = "adaptive"
        let targetSizeMB: number | undefined

        // Ajustar configurações baseado no tamanho
        if (videoInfo.estimatedSizeMB > 100) {
            compressionLevel = "ultra"
            targetSizeMB = 25
        } else if (videoInfo.estimatedSizeMB > 50) {
            compressionLevel = "high"
            targetSizeMB = 15
        } else {
            compressionLevel = "medium"
        }

        const result = await processAndUploadVideo({
            videoBase64,
            fileName: "video_adaptativo.mp4",
            bucketName: "adaptive-videos",
            options: {
                compressionLevel,
                targetSizeMB
            }
        })

        return result
    } catch (error) {
        console.error("Erro no processamento adaptativo:", error)
        throw error
    }
}

// Exemplo 5: Processamento apenas de compressão (sem conversão)
export async function compressionOnlyProcessing(videoBase64: string) {
    try {
        const result = await processAndUploadVideo({
            videoBase64,
            fileName: "video_comprimido.mp4",
            bucketName: "compressed-videos",
            options: {
                skipConversion: true, // Pular conversão
                compressionLevel: "high",
                targetSizeMB: 20
            }
        })

        return result
    } catch (error) {
        console.error("Erro na compressão:", error)
        throw error
    }
}

// Exemplo 6: Upload sem processamento
export async function uploadOnlyProcessing(videoBase64: string) {
    try {
        const result = await processAndUploadVideo({
            videoBase64,
            fileName: "video_original.mp4",
            bucketName: "original-videos",
            options: {
                skipConversion: true,
                skipCompression: true
            }
        })

        return result
    } catch (error) {
        console.error("Erro no upload:", error)
        throw error
    }
}

// Exemplo de uso em um controller
export class VideoController {
    async uploadVideo(req: any, res: any) {
        try {
            const { videoBase64, fileName, processingType = "social" } = req.body

            // Validar entrada
            if (!videoBase64 || !fileName) {
                return res.status(400).json({
                    error: "videoBase64 e fileName são obrigatórios"
                })
            }

            // Verificar se é um vídeo válido
            const videoInfo = getVideoInfo(videoBase64)
            if (!videoInfo.isValid) {
                return res.status(400).json({
                    error: "Arquivo fornecido não é um vídeo válido"
                })
            }

            // Selecionar configurações baseado no tipo
            let options = {}
            switch (processingType) {
                case "social":
                    options = {
                        compressionLevel: QUALITY_PRESETS.social.compressionLevel,
                        targetSizeMB: QUALITY_PRESETS.social.targetSizeMB,
                        maxDurationSeconds: QUALITY_PRESETS.social.maxDurationSeconds
                    }
                    break
                case "streaming":
                    options = {
                        compressionLevel: QUALITY_PRESETS.streaming.compressionLevel,
                        targetSizeMB: QUALITY_PRESETS.streaming.targetSizeMB
                    }
                    break
                case "preview":
                    options = {
                        compressionLevel: QUALITY_PRESETS.preview.compressionLevel,
                        targetSizeMB: QUALITY_PRESETS.preview.targetSizeMB,
                        maxDurationSeconds: QUALITY_PRESETS.preview.maxDurationSeconds
                    }
                    break
                default:
                    options = {
                        compressionLevel: DEFAULT_VIDEO_CONFIG.compressionLevel
                    }
            }

            // Processar vídeo
            const result = await processAndUploadVideo({
                videoBase64,
                fileName,
                bucketName: process.env.AWS_S3_BUCKET_NAME || "default-bucket",
                options
            })

            // Retornar resultado
            res.json({
                success: true,
                data: {
                    url: result.uploadResult.url,
                    key: result.uploadResult.key,
                    size: result.uploadResult.size,
                    contentType: result.uploadResult.contentType,
                    processing: {
                        wasConverted: result.processingStats.wasConverted,
                        wasCompressed: result.processingStats.wasCompressed,
                        compressionRatio: result.processingStats.compressionRatio,
                        processingTimeMs: result.processingStats.processingTimeMs
                    }
                }
            })

        } catch (error: any) {
            console.error("Erro no upload de vídeo:", error)
            res.status(500).json({
                error: "Erro interno do servidor",
                message: error.message
            })
        }
    }
}

// Exemplo de uso com moment-store-service
export async function createVideoMomentExample() {
    try {
        // Simular dados de um momento de vídeo
        const videoMoment = {
            id: BigInt(Date.now()),
            description: "Meu primeiro vídeo no Circle!",
            midia: {
                content_type: "VIDEO" as const,
                base64: "data:video/mp4;base64,UklGRnoGAABXQVZFZm10..." // Base64 do vídeo
            },
            metadata: {
                duration: 30, // 30 segundos
                file_name: "video_momento.mov",
                file_size: 25000000, // 25MB
                file_type: "video/mov" as const,
                resolution_width: 1920,
                resolution_height: 1080
            },
            tags: [
                { title: "viagem" },
                { title: "natureza" },
                { title: "aventura" }
            ],
            statistic: {
                is_trend: false,
                total_likes_num: 0,
                total_views_num: 0,
                total_shares_num: 0,
                total_reports_num: 0,
                total_skips_num: 0,
                total_comments_num: 0,
                total_profile_clicks_num: 0
            }
        }

        // Usar a função store_new_moment_video
        // const result = await store_new_moment_video({
        //     user_id: BigInt(123),
        //     moment: videoMoment
        // })

        console.log("Exemplo de estrutura para momento de vídeo:", videoMoment)
        
        return videoMoment
    } catch (error) {
        console.error("Erro no exemplo de momento de vídeo:", error)
        throw error
    }
} 