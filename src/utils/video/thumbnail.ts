import { ServiceError } from "../../errors"
import ffmpeg from "fluent-ffmpeg"
import fs from "fs"
import path from "path"
import { promisify } from "util"

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)

type VideoThumbnailProps = {
    videoBase64: string
    timeOffset?: number // Tempo em segundos para capturar o thumbnail
    width?: number
    height?: number
    quality?: number // 1-100
}

type ThumbnailResult = {
    thumbnailBase64: string
    width: number
    height: number
    timeOffset: number
}

export async function generateVideoThumbnail({
    videoBase64,
    timeOffset = 1, // Capturar thumbnail no segundo 1
    width = 640,
    height = 360,
    quality = 80
}: VideoThumbnailProps): Promise<ThumbnailResult> {
    const tempDir = path.join(process.cwd(), "temp")
    const inputFileName = `thumbnail_input_${Date.now()}.mp4`
    const outputFileName = `thumbnail_output_${Date.now()}.jpg`
    const inputPath = path.join(tempDir, inputFileName)
    const outputPath = path.join(tempDir, outputFileName)

    try {
        // Criar diretório temporário se não existir
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        // Decodificar base64 e salvar arquivo temporário
        const videoBuffer = Buffer.from(videoBase64, "base64")
        await writeFile(inputPath, videoBuffer)

        // Gerar thumbnail usando ffmpeg
        await new Promise<void>((resolve, reject) => {
            ffmpeg(inputPath)
                .seekInput(timeOffset) // Ir para o tempo especificado
                .frames(1) // Capturar apenas 1 frame
                .size(`${width}x${height}`) // Definir tamanho
                .output(outputPath)
                .outputOptions([
                    '-q:v', quality.toString(), // Qualidade JPEG
                    '-f', 'image2' // Formato de saída
                ])
                .on("end", () => {
                    console.log("Thumbnail gerado com sucesso")
                    resolve()
                })
                .on("error", (err) => {
                    console.error("Erro ao gerar thumbnail:", err)
                    reject(new ServiceError({ 
                        message: `Erro ao gerar thumbnail: ${err.message}` 
                    }))
                })
                .run()
        })

        // Ler arquivo de thumbnail e converter para base64
        const thumbnailBuffer = fs.readFileSync(outputPath)
        const thumbnailBase64 = thumbnailBuffer.toString("base64")

        // Limpar arquivos temporários
        await unlink(inputPath).catch(console.error)
        await unlink(outputPath).catch(console.error)

        return {
            thumbnailBase64,
            width,
            height,
            timeOffset
        }

    } catch (error: any) {
        // Limpar arquivos temporários em caso de erro
        await unlink(inputPath).catch(() => {})
        await unlink(outputPath).catch(() => {})
        
        throw new ServiceError({ 
            message: `Erro ao gerar thumbnail: ${error.message}` 
        })
    }
}

// Função para gerar múltiplos thumbnails em diferentes momentos
export async function generateMultipleThumbnails({
    videoBase64,
    timeOffsets = [1, 3, 5], // Segundos para capturar thumbnails
    width = 640,
    height = 360,
    quality = 80
}: {
    videoBase64: string
    timeOffsets?: number[]
    width?: number
    height?: number
    quality?: number
}): Promise<ThumbnailResult[]> {
    try {
        const thumbnails: ThumbnailResult[] = []

        // Gerar thumbnails sequencialmente para evitar sobrecarga
        for (const timeOffset of timeOffsets) {
            const thumbnail = await generateVideoThumbnail({
                videoBase64,
                timeOffset,
                width,
                height,
                quality
            })
            thumbnails.push(thumbnail)
        }

        return thumbnails

    } catch (error: any) {
        throw new ServiceError({ 
            message: `Erro ao gerar múltiplos thumbnails: ${error.message}` 
        })
    }
}

// Função para gerar thumbnail otimizado para diferentes resoluções
export async function generateOptimizedThumbnails({
    videoBase64,
    timeOffset = 1
}: {
    videoBase64: string
    timeOffset?: number
}): Promise<{
    fullhd: ThumbnailResult
    nhd: ThumbnailResult
}> {
    try {
        // Gerar thumbnail em Full HD
        const fullhdThumbnail = await generateVideoThumbnail({
            videoBase64,
            timeOffset,
            width: 1920,
            height: 1080,
            quality: 85
        })

        // Gerar thumbnail em NHD (menor resolução)
        const nhdThumbnail = await generateVideoThumbnail({
            videoBase64,
            timeOffset,
            width: 640,
            height: 360,
            quality: 75
        })

        return {
            fullhd: fullhdThumbnail,
            nhd: nhdThumbnail
        }

    } catch (error: any) {
        throw new ServiceError({ 
            message: `Erro ao gerar thumbnails otimizados: ${error.message}` 
        })
    }
}

// Função para obter informações do vídeo (duração, resolução, etc.)
export async function getVideoMetadata(videoBase64: string): Promise<{
    duration: number
    width: number
    height: number
    fps: number
    format: string
}> {
    const tempDir = path.join(process.cwd(), "temp")
    const inputFileName = `metadata_input_${Date.now()}.mp4`
    const inputPath = path.join(tempDir, inputFileName)

    try {
        // Criar diretório temporário se não existir
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        // Decodificar base64 e salvar arquivo temporário
        const videoBuffer = Buffer.from(videoBase64, "base64")
        await writeFile(inputPath, videoBuffer)

        // Obter metadados usando ffmpeg
        const metadata = await new Promise<any>((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) {
                    reject(new ServiceError({ 
                        message: `Erro ao obter metadados: ${err.message}` 
                    }))
                } else {
                    resolve(metadata)
                }
            })
        })

        // Extrair informações do vídeo
        const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video')
        
        if (!videoStream) {
            throw new ServiceError({ message: "Stream de vídeo não encontrado" })
        }

        // Limpar arquivo temporário
        await unlink(inputPath).catch(console.error)

        return {
            duration: Math.round(metadata.format.duration || 0),
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            fps: eval(videoStream.r_frame_rate) || 30, // Converter fração para número
            format: metadata.format.format_name || 'unknown'
        }

    } catch (error: any) {
        // Limpar arquivo temporário em caso de erro
        await unlink(inputPath).catch(() => {})
        
        throw new ServiceError({ 
            message: `Erro ao obter metadados do vídeo: ${error.message}` 
        })
    }
} 