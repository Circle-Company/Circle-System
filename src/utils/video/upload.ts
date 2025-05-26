import { AWS_S3 } from "../../config/AWS_S3"
import { ServiceError } from "../../errors"
import crypto from "crypto"

type UploadVideoAWSS3Props = {
    videoBase64: string
    bucketName: string
    fileName: string
    contentType?: string
}

export type VideoUploadResult = {
    url: string
    key: string
    size: number
    contentType: string
}

const generateHashKey = (fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, hash) => {
            if (err) {
                reject(new ServiceError({ message: err.message }))
            } else {
                const hashKey = `videos/${hash.toString("hex")}-${fileName}`
                resolve(hashKey)
            }
        })
    })
}

const getContentType = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop()
    
    switch (extension) {
        case 'mp4':
            return 'video/mp4'
        case 'mov':
            return 'video/quicktime'
        case 'avi':
            return 'video/x-msvideo'
        case 'webm':
            return 'video/webm'
        case '3gp':
            return 'video/3gpp'
        case 'mkv':
            return 'video/x-matroska'
        case 'flv':
            return 'video/x-flv'
        case 'wmv':
            return 'video/x-ms-wmv'
        default:
            return 'video/mp4' // Default para MP4
    }
}

export async function uploadVideoAWSS3({
    videoBase64,
    bucketName,
    fileName,
    contentType
}: UploadVideoAWSS3Props): Promise<VideoUploadResult> {
    try {
        // Decodificar o vídeo base64 para um buffer
        const videoBuffer = Buffer.from(videoBase64, "base64")
        
        // Verificar se o arquivo não está vazio
        if (videoBuffer.length === 0) {
            throw new ServiceError({ message: "Arquivo de vídeo está vazio" })
        }

        // Gerar chave única para o arquivo
        const hashKey = await generateHashKey(fileName)
            .then((key) => key)
            .catch((err) => {
                throw new ServiceError({ message: err.message })
            })

        // Determinar o tipo de conteúdo
        const finalContentType = contentType || getContentType(fileName)

        // Parâmetros para enviar o vídeo para o S3
        const params = {
            Bucket: bucketName,
            Key: hashKey,
            Body: videoBuffer,
            ContentType: finalContentType,
            ACL: "public-read" as const,
            Metadata: {
                'original-filename': fileName,
                'upload-timestamp': new Date().toISOString(),
                'file-size': videoBuffer.length.toString()
            },
            // Configurações específicas para vídeos
            CacheControl: 'max-age=31536000', // Cache por 1 ano
            ContentDisposition: `inline; filename="${fileName}"`
        }

        // Enviar o vídeo para o S3
        const uploadResult = await AWS_S3.upload(params).promise()
        
        return {
            url: uploadResult.Location,
            key: uploadResult.Key,
            size: videoBuffer.length,
            contentType: finalContentType
        }

    } catch (error: any) {
        console.error("Erro ao enviar vídeo para o S3:", error)
        throw new ServiceError({ 
            message: `Erro no upload do vídeo: ${error.message}` 
        })
    }
}

// Função para upload de múltiplos vídeos
export async function uploadMultipleVideosAWSS3(
    videos: Array<{
        videoBase64: string
        fileName: string
        contentType?: string
    }>,
    bucketName: string
): Promise<VideoUploadResult[]> {
    try {
        const uploadPromises = videos.map(video => 
            uploadVideoAWSS3({
                videoBase64: video.videoBase64,
                bucketName,
                fileName: video.fileName,
                contentType: video.contentType
            })
        )

        const results = await Promise.all(uploadPromises)
        return results

    } catch (error: any) {
        throw new ServiceError({ 
            message: `Erro no upload múltiplo de vídeos: ${error.message}` 
        })
    }
}

// Função para deletar vídeo do S3
export async function deleteVideoAWSS3(
    bucketName: string, 
    key: string
): Promise<void> {
    try {
        const params = {
            Bucket: bucketName,
            Key: key
        }

        await AWS_S3.deleteObject(params).promise()
        console.log(`Vídeo deletado com sucesso: ${key}`)

    } catch (error: any) {
        throw new ServiceError({ 
            message: `Erro ao deletar vídeo: ${error.message}` 
        })
    }
} 