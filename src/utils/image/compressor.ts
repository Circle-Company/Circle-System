import sharp from "sharp"
import { ServiceError } from "../../errors"

type ImageCompressorProps = {
    imageBase64: string
    quality: number
    img_width: number
    isMoment?: boolean
    resolution: "FULL_HD" | "NHD"
}

export async function image_compressor({
    imageBase64,
    quality,
    img_width,
    resolution,
    isMoment = true,
}: ImageCompressorProps) {
    try {
        const imageBuffer = Buffer.from(
            imageBase64.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
        )
        const aspectRatio = 1.566
        const targetWidth = Math.trunc(img_width > 1080 ? 1080 : img_width)
        const targetHeight = Math.trunc(isMoment ? targetWidth * aspectRatio : targetWidth)
        if (resolution == "FULL_HD") {
            const compressedImageBuffer = await sharp(imageBuffer)
                .resize({ width: targetWidth, height: targetHeight, fit: "cover" }) // Redimensionar para largura e altura máximas especificadas
                .jpeg({ quality }) // Definir qualidade JPEG
                .toBuffer()
            return compressedImageBuffer.toString("base64")
        }
        if (resolution == "NHD") {
            const compressedImageBuffer = await sharp(imageBuffer)
                .resize({
                    width: Math.ceil(targetWidth / 3),
                    height: Math.ceil(targetHeight / 3),
                    fit: "cover",
                }) // Redimensionar para largura e altura máximas especificadas
                .jpeg({ quality }) // Definir qualidade JPEG
                .toBuffer()
            return compressedImageBuffer.toString("base64")
        } else return imageBase64
    } catch (err: any) {
        throw new ServiceError({ message: err.message })
    }
}
