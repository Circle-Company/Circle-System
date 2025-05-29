// Exportar funções de conversão
export { convertVideoToMp4 } from "./converter"

// Exportar funções de compressão
export { compressVideo } from "./compressor"

// Exportar funções de upload
export { 
    uploadVideoAWSS3, 
    uploadMultipleVideosAWSS3, 
    deleteVideoAWSS3,
    type VideoUploadResult 
} from "./upload"

// Exportar processador principal
export { 
    processAndUploadVideo, 
    processBatchVideos, 
    getVideoInfo 
} from "./processor"

// Exportar funções de thumbnail
export {
    generateVideoThumbnail,
    generateMultipleThumbnails,
    generateOptimizedThumbnails,
    generatePreviewThumbnail,
    getVideoMetadata
} from "./thumbnail"

// Tipos principais para facilitar o uso
export type VideoQuality = "low" | "medium" | "high" | "ultra"
export type CompressionLevel = "low" | "medium" | "high" | "ultra" | "adaptive"
export type VideoFormat = "mp4" | "mov" | "avi" | "webm" | "3gp" | "mkv" | "flv" | "wmv"

// Configurações padrão
export const DEFAULT_VIDEO_CONFIG = {
    compressionLevel: "medium" as CompressionLevel,
    outputFormat: "mp4" as const,
    quality: "medium" as VideoQuality,
    maxSizeMB: 50,
    maxDurationSeconds: 300 // 5 minutos
}

// Formatos suportados
export const SUPPORTED_VIDEO_FORMATS: VideoFormat[] = [
    "mp4", "mov", "avi", "webm", "3gp", "mkv", "flv", "wmv"
]

// Configurações de qualidade recomendadas por uso
export const QUALITY_PRESETS = {
    // Para redes sociais (Instagram, TikTok)
    social: {
        compressionLevel: "medium" as CompressionLevel,
        targetSizeMB: 25,
        maxDurationSeconds: 60,
        resolution: "1080p"
    },
    // Para streaming/web
    streaming: {
        compressionLevel: "high" as CompressionLevel,
        targetSizeMB: 100,
        maxDurationSeconds: 600,
        resolution: "1080p"
    },
    // Para armazenamento/backup
    archive: {
        compressionLevel: "low" as CompressionLevel,
        targetSizeMB: 500,
        maxDurationSeconds: 3600,
        resolution: "original"
    },
    // Para preview/thumbnail
    preview: {
        compressionLevel: "ultra" as CompressionLevel,
        targetSizeMB: 5,
        maxDurationSeconds: 30,
        resolution: "720p"
    }
} as const 