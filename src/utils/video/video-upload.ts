import { VideoUploadResult, uploadVideoAWSS3 } from "./upload"

import { compressVideo } from "./compressor"

export type VideoUploadOptions = {
    bucketName: string
    compressionLevel?: "low" | "medium" | "high" | "ultra" | "adaptive"
    targetSizeMB?: number
    maxDurationSeconds?: number
    contentType?: string
}

export type CompressResult = {
    compressedVideoBase64: string
    originalSizeMB: number
    compressedSizeMB: number
    compressionRatio: number
}

export class VideoUpload {
    private bucketName: string
    private compressionLevel: "low" | "medium" | "high" | "ultra" | "adaptive"
    private targetSizeMB?: number
    private maxDurationSeconds?: number
    private contentType?: string

    constructor(options: VideoUploadOptions) {
        this.bucketName = options.bucketName
        this.compressionLevel = options.compressionLevel || "medium"
        this.targetSizeMB = options.targetSizeMB
        this.maxDurationSeconds = options.maxDurationSeconds
        this.contentType = options.contentType
    }

    async compress(videoBase64: string, opts?: Partial<VideoUploadOptions>): Promise<CompressResult> {
        const result = await compressVideo({
            videoBase64,
            compressionLevel: opts?.compressionLevel || this.compressionLevel,
            targetSizeMB: opts?.targetSizeMB ?? this.targetSizeMB,
            maxDurationSeconds: opts?.maxDurationSeconds ?? this.maxDurationSeconds
        })
        return result
    }

    async upload(videoBase64: string, fileName: string, opts?: Partial<VideoUploadOptions>): Promise<VideoUploadResult> {
        const result = await uploadVideoAWSS3({
            videoBase64,
            bucketName: opts?.bucketName || this.bucketName,
            fileName,
            contentType: opts?.contentType || this.contentType
        })
        return result
    }

    async compressAndUpload(videoBase64: string, fileName: string, opts?: Partial<VideoUploadOptions>): Promise<{
        uploadResult: VideoUploadResult
        compressResult: CompressResult
    }> {
        const compressResult = await this.compress(videoBase64, opts)
        const uploadResult = await this.upload(compressResult.compressedVideoBase64, fileName, opts)
        return { uploadResult, compressResult }
    }
} 