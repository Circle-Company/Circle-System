import { VideoUploadResult, uploadVideoAWSS3 } from "./upload"

import { ServiceError } from "../../errors"
import { compressVideo } from "./compressor"
import { convertVideoToMp4 } from "./converter"

type VideoProcessorProps = {
    videoBase64: string
    fileName: string
    bucketName: string
    options?: {
        inputFormat?: string
        compressionLevel?: "low" | "medium" | "high" | "ultra" | "adaptive"
        targetSizeMB?: number
        maxDurationSeconds?: number
        skipConversion?: boolean
        skipCompression?: boolean
        contentType?: string
    }
}

type VideoProcessingResult = {
    uploadResult: VideoUploadResult
    processingStats: {
        originalSizeMB?: number
        compressedSizeMB?: number
        compressionRatio?: number
        wasConverted: boolean
        wasCompressed: boolean
        processingTimeMs: number
    }
}

// Função para detectar formato do vídeo baseado no cabeçalho do arquivo
const detectVideoFormat = (base64: string): string => {
    const buffer = Buffer.from(base64.slice(0, 100), "base64")
    const header = buffer.toString("hex").toUpperCase()
    
    // Assinaturas de diferentes formatos de vídeo
    if (header.includes("667479706D703432") || header.includes("667479706D703431")) {
        return "mp4"
    } else if (header.includes("667479707174")) {
        return "mov"
    } else if (header.includes("52494646") && header.includes("41564920")) {
        return "avi"
    } else if (header.includes("1A45DFA3")) {
        return "webm"
    } else if (header.includes("667479703367")) {
        return "3gp"
    } else {
        return "unknown"
    }
}

// Função para validar se o arquivo é um vídeo válido
const validateVideoFile = (base64: string): boolean => {
    try {
        const buffer = Buffer.from(base64.slice(0, 100), "base64")
        const format = detectVideoFormat(base64)
        
        // Verificar se o arquivo tem tamanho mínimo
        if (buffer.length < 50) {
            return false
        }
        
        // Verificar se é um formato de vídeo conhecido
        return format !== "unknown"
    } catch {
        return false
    }
}

export async function processAndUploadVideo({
    videoBase64,
    fileName,
    bucketName,
    options = {}
}: VideoProcessorProps): Promise<VideoProcessingResult> {
    const startTime = Date.now()
    let currentVideoBase64 = videoBase64
    let wasConverted = false
    let wasCompressed = false
    let originalSizeMB: number | undefined
    let compressedSizeMB: number | undefined
    let compressionRatio: number | undefined

    try {
        // Validar arquivo de vídeo
        if (!validateVideoFile(videoBase64)) {
            throw new ServiceError({ 
                message: "Arquivo fornecido não é um vídeo válido" 
            })
        }

        const detectedFormat = detectVideoFormat(videoBase64)
        console.log(`Formato detectado: ${detectedFormat}`)

        // Etapa 1: Conversão (se necessário)
        if (!options.skipConversion) {
            const needsConversion = detectedFormat !== "mp4" || options.inputFormat
            
            if (needsConversion) {
                console.log("Iniciando conversão para MP4...")
                currentVideoBase64 = await convertVideoToMp4({
                    videoBase64: currentVideoBase64,
                    inputFormat: options.inputFormat || detectedFormat,
                    quality: options.compressionLevel === "ultra" ? "ultra" : 
                            options.compressionLevel === "high" ? "high" : "medium"
                })
                wasConverted = true
                console.log("Conversão concluída")
            }
        }

        // Etapa 2: Compressão (se necessário)
        if (!options.skipCompression) {
            console.log("Iniciando compressão...")
            const compressionResult = await compressVideo({
                videoBase64: currentVideoBase64,
                compressionLevel: options.compressionLevel || "medium",
                targetSizeMB: options.targetSizeMB,
                maxDurationSeconds: options.maxDurationSeconds
            })
            
            currentVideoBase64 = compressionResult.compressedVideoBase64
            originalSizeMB = compressionResult.originalSizeMB
            compressedSizeMB = compressionResult.compressedSizeMB
            compressionRatio = compressionResult.compressionRatio
            wasCompressed = true
            console.log(`Compressão concluída: ${compressionRatio}% de redução`)
        }

        // Etapa 3: Upload para S3
        console.log("Iniciando upload para S3...")
        const uploadResult = await uploadVideoAWSS3({
            videoBase64: currentVideoBase64,
            bucketName,
            fileName: fileName.replace(/\.[^/.]+$/, ".mp4"), // Garantir extensão .mp4
            contentType: options.contentType || "video/mp4"
        })
        console.log("Upload concluído")

        const processingTimeMs = Date.now() - startTime

        return {
            uploadResult,
            processingStats: {
                originalSizeMB,
                compressedSizeMB,
                compressionRatio,
                wasConverted,
                wasCompressed,
                processingTimeMs
            }
        }

    } catch (error: any) {
        const processingTimeMs = Date.now() - startTime
        console.error(`Erro no processamento após ${processingTimeMs}ms:`, error)
        
        throw new ServiceError({ 
            message: `Erro no processamento do vídeo: ${error.message}` 
        })
    }
}

// Função para processamento em lote
export async function processBatchVideos(
    videos: Array<{
        videoBase64: string
        fileName: string
        options?: VideoProcessorProps["options"]
    }>,
    bucketName: string
): Promise<VideoProcessingResult[]> {
    try {
        const results: VideoProcessingResult[] = []
        
        // Processar vídeos sequencialmente para evitar sobrecarga
        for (const video of videos) {
            console.log(`Processando vídeo: ${video.fileName}`)
            
            const result = await processAndUploadVideo({
                videoBase64: video.videoBase64,
                fileName: video.fileName,
                bucketName,
                options: video.options
            })
            
            results.push(result)
            console.log(`Vídeo processado: ${video.fileName}`)
        }
        
        return results

    } catch (error: any) {
        throw new ServiceError({ 
            message: `Erro no processamento em lote: ${error.message}` 
        })
    }
}

// Função para obter informações do vídeo sem processamento
export function getVideoInfo(videoBase64: string): {
    format: string
    isValid: boolean
    estimatedSizeMB: number
} {
    try {
        const format = detectVideoFormat(videoBase64)
        const isValid = validateVideoFile(videoBase64)
        const buffer = Buffer.from(videoBase64, "base64")
        const estimatedSizeMB = buffer.length / (1024 * 1024)

        return {
            format,
            isValid,
            estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100
        }
    } catch (error) {
        return {
            format: "unknown",
            isValid: false,
            estimatedSizeMB: 0
        }
    }
} 