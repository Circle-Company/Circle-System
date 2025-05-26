import { ServiceError } from "../../errors"
import ffmpeg from "fluent-ffmpeg"
import fs from "fs"
import path from "path"
import { promisify } from "util"

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)

type VideoConverterProps = {
    videoBase64: string
    inputFormat?: string
    outputFormat?: "mp4" | "webm"
    quality?: "low" | "medium" | "high" | "ultra"
}

type ConversionSettings = {
    videoBitrate: string
    audioBitrate: string
    fps: number
    scale?: string
    crf?: number
}

const getConversionSettings = (quality: string): ConversionSettings => {
    switch (quality) {
        case "low":
            return {
                videoBitrate: "500k",
                audioBitrate: "64k",
                fps: 24,
                scale: "640:360",
                crf: 28
            }
        case "medium":
            return {
                videoBitrate: "1000k",
                audioBitrate: "128k",
                fps: 30,
                scale: "1280:720",
                crf: 23
            }
        case "high":
            return {
                videoBitrate: "2000k",
                audioBitrate: "192k",
                fps: 30,
                scale: "1920:1080",
                crf: 20
            }
        case "ultra":
            return {
                videoBitrate: "4000k",
                audioBitrate: "256k",
                fps: 60,
                crf: 18
            }
        default:
            return {
                videoBitrate: "1000k",
                audioBitrate: "128k",
                fps: 30,
                scale: "1280:720",
                crf: 23
            }
    }
}

export async function convertVideoToMp4({
    videoBase64,
    inputFormat = "auto",
    outputFormat = "mp4",
    quality = "medium"
}: VideoConverterProps): Promise<string> {
    const tempDir = path.join(process.cwd(), "temp")
    const inputFileName = `input_${Date.now()}.${inputFormat === "auto" ? "tmp" : inputFormat}`
    const outputFileName = `output_${Date.now()}.${outputFormat}`
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

        const settings = getConversionSettings(quality)

        // Converter vídeo usando ffmpeg
        await new Promise<void>((resolve, reject) => {
            let command = ffmpeg(inputPath)
                .output(outputPath)
                .videoCodec("libx264")
                .audioCodec("aac")
                .videoBitrate(settings.videoBitrate)
                .audioBitrate(settings.audioBitrate)
                .fps(settings.fps)
                .addOption("-preset", "medium")
                .addOption("-movflags", "+faststart") // Otimização para streaming

            // Adicionar CRF para controle de qualidade
            if (settings.crf) {
                command = command.addOption("-crf", settings.crf.toString())
            }

            // Adicionar escala se especificada
            if (settings.scale) {
                command = command.size(settings.scale)
            }

            // Configurações específicas para diferentes formatos de entrada
            if (inputFormat === "mov" || inputFormat === "auto") {
                command = command.addOption("-pix_fmt", "yuv420p")
            }

            if (inputFormat === "3gp") {
                command = command.addOption("-strict", "experimental")
            }

            command
                .on("end", () => {
                    console.log("Conversão de vídeo concluída")
                    resolve()
                })
                .on("error", (err) => {
                    console.error("Erro na conversão:", err)
                    reject(new ServiceError({ 
                        message: `Erro na conversão de vídeo: ${err.message}` 
                    }))
                })
                .on("progress", (progress) => {
                    console.log(`Progresso: ${Math.round(progress.percent || 0)}%`)
                })
                .run()
        })

        // Ler arquivo convertido e converter para base64
        const convertedBuffer = fs.readFileSync(outputPath)
        const convertedBase64 = convertedBuffer.toString("base64")

        // Limpar arquivos temporários
        await unlink(inputPath).catch(console.error)
        await unlink(outputPath).catch(console.error)

        return convertedBase64

    } catch (error: any) {
        // Limpar arquivos temporários em caso de erro
        await unlink(inputPath).catch(() => {})
        await unlink(outputPath).catch(() => {})
        
        throw new ServiceError({ 
            message: `Erro na conversão de vídeo: ${error.message}` 
        })
    }
} 