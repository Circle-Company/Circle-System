import { ServiceError } from "../../errors"
import ffmpeg from "fluent-ffmpeg"
import fs from "fs"
import path from "path"
import { promisify } from "util"

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)
const stat = promisify(fs.stat)

type VideoCompressorProps = {
    videoBase64: string
    compressionLevel: "low" | "medium" | "high" | "ultra" | "adaptive"
    targetSizeMB?: number
    maxDurationSeconds?: number
}

type CompressionSettings = {
    videoBitrate: string
    audioBitrate: string
    crf: number
    preset: string
    scale?: string
    fps?: number
}

const getCompressionSettings = (level: string, fileSizeMB?: number): CompressionSettings => {
    // Compressão adaptativa baseada no tamanho do arquivo
    if (level === "adaptive" && fileSizeMB) {
        if (fileSizeMB > 100) {
            return {
                videoBitrate: "800k",
                audioBitrate: "96k",
                crf: 26,
                preset: "medium",
                scale: "1280:720",
                fps: 24
            }
        } else if (fileSizeMB > 50) {
            return {
                videoBitrate: "1200k",
                audioBitrate: "128k",
                crf: 24,
                preset: "medium",
                scale: "1280:720",
                fps: 30
            }
        } else if (fileSizeMB > 20) {
            return {
                videoBitrate: "1500k",
                audioBitrate: "160k",
                crf: 22,
                preset: "medium",
                fps: 30
            }
        } else {
            return {
                videoBitrate: "2000k",
                audioBitrate: "192k",
                crf: 20,
                preset: "fast",
                fps: 30
            }
        }
    }

    // Configurações predefinidas
    switch (level) {
        case "low":
            return {
                videoBitrate: "400k",
                audioBitrate: "64k",
                crf: 30,
                preset: "fast",
                scale: "640:360",
                fps: 24
            }
        case "medium":
            return {
                videoBitrate: "800k",
                audioBitrate: "96k",
                crf: 26,
                preset: "medium",
                scale: "1280:720",
                fps: 30
            }
        case "high":
            return {
                videoBitrate: "1500k",
                audioBitrate: "128k",
                crf: 22,
                preset: "medium",
                scale: "1920:1080",
                fps: 30
            }
        case "ultra":
            return {
                videoBitrate: "3000k",
                audioBitrate: "192k",
                crf: 18,
                preset: "slow",
                fps: 60
            }
        default:
            return {
                videoBitrate: "1000k",
                audioBitrate: "128k",
                crf: 24,
                preset: "medium",
                scale: "1280:720",
                fps: 30
            }
    }
}

export async function compressVideo({
    videoBase64,
    compressionLevel = "medium",
    targetSizeMB,
    maxDurationSeconds
}: VideoCompressorProps): Promise<{
    compressedVideoBase64: string
    originalSizeMB: number
    compressedSizeMB: number
    compressionRatio: number
}> {
    const tempDir = path.join(process.cwd(), "temp")
    const inputFileName = `compress_input_${Date.now()}.mp4`
    const outputFileName = `compress_output_${Date.now()}.mp4`
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

        // Obter tamanho do arquivo original
        const originalStats = await stat(inputPath)
        const originalSizeMB = originalStats.size / (1024 * 1024)

        const settings = getCompressionSettings(compressionLevel, originalSizeMB)

        // Comprimir vídeo usando ffmpeg
        await new Promise<void>((resolve, reject) => {
            let command = ffmpeg(inputPath)
                .output(outputPath)
                .videoCodec("libx264")
                .audioCodec("aac")
                .addOption("-preset", settings.preset)
                .addOption("-crf", settings.crf.toString())
                .addOption("-movflags", "+faststart")
                .addOption("-pix_fmt", "yuv420p")

            // Configurar bitrates
            command = command
                .videoBitrate(settings.videoBitrate)
                .audioBitrate(settings.audioBitrate)

            // Configurar FPS se especificado
            if (settings.fps) {
                command = command.fps(settings.fps)
            }

            // Configurar escala se especificada
            if (settings.scale) {
                command = command.size(settings.scale)
            }

            // Limitar duração se especificado
            if (maxDurationSeconds) {
                command = command.duration(maxDurationSeconds)
            }

            // Configurações para otimização de tamanho
            if (targetSizeMB) {
                const targetBitrate = Math.floor((targetSizeMB * 8 * 1024) / (maxDurationSeconds || 60))
                command = command.videoBitrate(`${targetBitrate}k`)
            }

            command
                .on("end", () => {
                    console.log("Compressão de vídeo concluída")
                    resolve()
                })
                .on("error", (err) => {
                    console.error("Erro na compressão:", err)
                    reject(new ServiceError({ 
                        message: `Erro na compressão de vídeo: ${err.message}` 
                    }))
                })
                .on("progress", (progress) => {
                    console.log(`Progresso da compressão: ${Math.round(progress.percent || 0)}%`)
                })
                .run()
        })

        // Ler arquivo comprimido e obter estatísticas
        const compressedBuffer = fs.readFileSync(outputPath)
        const compressedStats = await stat(outputPath)
        const compressedSizeMB = compressedStats.size / (1024 * 1024)
        const compressionRatio = ((originalSizeMB - compressedSizeMB) / originalSizeMB) * 100

        const compressedBase64 = compressedBuffer.toString("base64")

        // Limpar arquivos temporários
        await unlink(inputPath).catch(console.error)
        await unlink(outputPath).catch(console.error)

        return {
            compressedVideoBase64: compressedBase64,
            originalSizeMB: Math.round(originalSizeMB * 100) / 100,
            compressedSizeMB: Math.round(compressedSizeMB * 100) / 100,
            compressionRatio: Math.round(compressionRatio * 100) / 100
        }

    } catch (error: any) {
        // Limpar arquivos temporários em caso de erro
        await unlink(inputPath).catch(() => {})
        await unlink(outputPath).catch(() => {})
        
        throw new ServiceError({ 
            message: `Erro na compressão de vídeo: ${error.message}` 
        })
    }
} 